"""Python reference for wrapper.js in this folder.

The same logic the browser wrapper implements, kept in Python so the
differential test can prove the shipped JavaScript agrees with Python end to
end - unit conversion, table building and number formatting included, not just
the algorithm.

This is a direct port of the logic in the Streamlit front end (model496.py):
same rules, same message wording, same ordering.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

log = logging.getLogger("usg-sizing")

ALGORITHM = Path(__file__).resolve().parent / "algorithm.py"
_CODE = compile(ALGORITHM.read_text(encoding="utf-8"), str(ALGORITHM), "exec")

PIPE_OPTIONS = ["N/A", '3/8"', '1/2"', '3/4"', '1"']
INLET_UNITS = ["psi", "bar", "kPa"]
OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"]
FLOW_UNITS = ["CFH", "CMH", "BTUH"]
GAS_TYPES = ["Natural Gas", "Propane", "Other"]

BODY_SIZES = [
    ('Model 496, 3/8" Body', "R49638"),
    ('Model 496, 1/2" Body', "R49612"),
    ('Model 496, 3/4" Body', "R49634"),
    ('Model 496, 1" Body', "R49610"),
]

DEFAULTS = {
    "inlet": 0, "inlet_units": "psi",
    "outlet": 0, "outlet_units": "psi",
    "flow": 0, "flow_units": "CFH",
    "maop": 0,
    "pipe_size": "N/A",
    "opp_required": False, "irv_pressure": 2.0, "partial_irv": False,
    "high_efficiency": False, "high_efficiency_pct": 100,
    "override_oversize": False, "oversize_pct": 25,
    "gas_type": "Natural Gas", "specific_gravity": 0.6,
    "high_altitude": False, "atmospheric_pressure": 14.40,
}


class SizingError(RuntimeError):
    pass


# Set to the exception message when the algorithm itself faults, so the
# differential test can require both languages to fail identically.
LAST_ALGORITHM_ERROR = None


class _P:
    """Attribute access over a plain dict, with the same defaults as the JS."""

    def __init__(self, d):
        merged = dict(DEFAULTS)
        merged.update({k: v for k, v in (d or {}).items() if v is not None})
        self.__dict__.update(merged)


def to_psi(val: float, units: str) -> float:
    if units == "in wc":
        return val * (1 / 28)
    if units == "bar":
        return val * 14.5
    if units == "oz":
        return val / 16
    if units == "kPa":
        return val / 6.89476
    return val


def _kv(label: str, value: Any) -> Dict[str, str]:
    return {"label": str(label), "value": str(value)}


def run(payload) -> Dict[str, Any]:
    """Take input values, return the same object shape as the JS wrapper."""
    global LAST_ALGORITHM_ERROR
    LAST_ALGORITHM_ERROR = None
    if isinstance(payload, dict):
        payload = _P(payload)

    # Match the widget types of the original tool: pressures are floats,
    # flow and MAIP are whole numbers.
    inlet_input = float(payload.inlet)
    outlet_input = float(payload.outlet)
    flow_rate = int(payload.flow)
    maop = int(payload.maop)

    pipesize_raw = payload.pipe_size
    pipesize_input = 0 if pipesize_raw == "N/A" else pipesize_raw

    # ---- overpressure protection ----
    irv_input = 0.0
    opp_type = "None"
    if payload.opp_required:
        irv_input = float(payload.irv_pressure)
        opp_type = "IRV"
    elif payload.partial_irv:
        opp_type = "Partial"

    # ---- oversizing ----
    pload = 0.0
    pload_pct = 0
    if payload.high_efficiency:
        pload_pct = payload.high_efficiency_pct
        pload = pload_pct / 100.0
    oversizeby = 1.25 + (0.75 * pload)
    oversize_percent = (oversizeby - 1) * 100
    if payload.override_oversize:
        oversizeby = 1 + (payload.oversize_pct / 100)
        oversize_percent = (oversizeby - 1) * 100

    # ---- gas type ----
    gastypemult = 1.0
    if payload.gas_type == "Propane":
        gastypemult = 0.63
    elif payload.gas_type == "Other":
        gastypemult = min(1.0, (0.6 / payload.specific_gravity) ** 0.5)

    patm = float(payload.atmospheric_pressure) if payload.high_altitude else 14.4

    inlet_psi = to_psi(inlet_input, payload.inlet_units)
    outlet_psi = to_psi(outlet_input, payload.outlet_units)

    # ---- validation (same rules, wording and order as the original tool) ----
    errors: List[str] = []
    if inlet_psi > 0 and (inlet_psi > 125 or inlet_psi < 1):
        errors.append("Inlet pressure must be between 1 and 125 psi.")
    if outlet_psi > 0 and (outlet_psi < 3.5 / 28 or outlet_psi > 2):
        errors.append('Outlet pressure must be between 3.5" wc and 2 psi.')
    if inlet_psi > 0 and outlet_psi > 0 and outlet_psi >= inlet_psi:
        errors.append("Outlet pressure must be less than inlet pressure.")
    if int(maop) != 0 and maop < inlet_psi:
        errors.append("MAIP must be >= inlet pressure.")
    if inlet_psi == 0:
        errors.append("Inlet pressure is required.")
    if outlet_psi == 0:
        errors.append("Outlet pressure is required.")
    if flow_rate == 0:
        errors.append("Please enter a gas load / flow rate.")

    if errors:
        return {"ok": False, "errors": errors}

    # ---- elevation capacity reduction ----
    # Computed AFTER validation on purpose: when inlet equals outlet this
    # formula divides by zero (both the numerator and denominator collapse).
    # That input is always rejected above, so the figure is never needed - but
    # computing it first made Python raise ZeroDivisionError while JavaScript
    # quietly produced NaN. Same reason in wrapper.js.
    if patm < 14.4:
        ratio = (inlet_psi + patm) / (outlet_psi + patm)
        if ratio < 1.894:
            elevation_reduction = 100 * (
                1
                - (((outlet_psi + patm) * ((inlet_psi + patm) - (outlet_psi + patm))) ** 0.5)
                / (((outlet_psi + 14.65) * ((inlet_psi + 14.65) - (outlet_psi + 14.65))) ** 0.5)
            )
        else:
            elevation_reduction = 100 * (1 - (inlet_psi + patm) / (inlet_psi + 14.65))
    else:
        elevation_reduction = 0


    # ---- flow unit conversion ----
    flow_cfh = float(flow_rate)
    maop_psi = inlet_psi if maop == 0 else float(maop)

    if payload.flow_units == "CMH":
        flow_cfh *= 35.3147
    elif payload.flow_units == "BTUH":
        if payload.gas_type == "Natural Gas":
            flow_cfh /= 1000
        elif payload.gas_type == "Propane":
            flow_cfh /= 2516
        else:
            return {
                "ok": False,
                "errors": [
                    "BTUH conversion only supported for Natural Gas or Propane. Use CFH or CMH."
                ],
            }

    # ---- run the algorithm in a fresh namespace ----
    ns: Dict[str, Any] = {}
    exec(_CODE, ns)  # noqa: S102 - trusted first-party source
    ns.update(
        inlet_input=inlet_psi,
        outlet_input=outlet_psi,
        flow_rate=flow_cfh,
        maop=maop_psi,
        pipesize_input=pipesize_input,
        opp_type=opp_type,
        irv_input=irv_input,
        oversizeby=oversizeby,
        oversize_percent=oversize_percent,
        gastypemult=gastypemult,
        pload=pload,
        Patm=patm,
        result496={},
    )

    try:
        result496, match496, apply496, warning496 = ns["run_regulator_selection496"](
            inlet_psi, outlet_psi, opp_type
        )
    except Exception as exc:
        LAST_ALGORITHM_ERROR = str(exc)
        log.exception(
            "algorithm error: inlet=%s outlet=%s flow=%s opp=%s",
            inlet_psi, outlet_psi, flow_cfh, opp_type,
        )
        return {
            "ok": False,
            "errors": [
                "This combination could not be sized automatically. "
                "Please contact Holland Supply Company to review the selection."
            ],
        }

    ns["result496"] = result496

    warnings = [warning496] if warning496 else []

    if not apply496 and result496 is None:
        return {
            "ok": True,
            "selected": False,
            "errors": [],
            "warnings": warnings,
            "message": "Model 496 will not work for this application.",
            "stopped": True,
        }

    out: Dict[str, Any] = {
        "ok": True,
        "selected": bool(apply496),
        "errors": [],
        "warnings": warnings,
        "message": "Regulator selected!" if apply496 else "Model 496 will not work for this application.",
    }

    if apply496:
        mon_spring = None
        if match496.get("mon_color"):
            mon_spring = f"{match496.get('mon_color')} {match496.get('mon_range', '')}".strip()
        raw_fields = [
            ("Model", match496.get("model")),
            ("Body Size", match496.get("body")),
            ("Orifice Size", match496.get("orifice")),
            ("Seat", match496.get("seat")),
            ("Spring", f"{match496.get('color', '')} {match496.get('range', '')}".strip()),
            ("Monitor Spring", mon_spring),
        ]
        out["selection"] = [_kv(label, value) for label, value in raw_fields if value]

        cap = match496.get("capacity")
        capacity = None
        if cap and cap != "N/A":
            try:
                capacity = f"{int(round(float(cap))):,}"
            except (TypeError, ValueError):
                capacity = str(cap)
        out["capacity"] = capacity

        # hsc_pnc* now return a dict: worker, an optional monitor, and an optional
        # control line kit with its quantity.
        pn = ns["hsc_pnc496"](match496)
        out["part_numbers"] = [p for p in (pn.get("worker"), pn.get("monitor")) if p]

        # The control line kit is a real SKU with its own quantity. It goes in the
        # cart and on the page, but not in the PDF.
        out["control_line"] = pn.get("controlline") or None
        out["control_line_qty"] = pn.get("controllineqty")

    # ---- the four capacity tables (mirrors build_table) ----
    # Guarded like the selection run: a spring or orifice lookup can fault on a
    # value outside its table, and that must produce a readable message rather
    # than a traceback.
    try:
        is_irv = opp_type == "IRV"
        columns = ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work"] + (
            ["Will IRV Work"] if is_irv else []
        )
        tables = []
        for title, prefix in BODY_SIZES:
            rows = []
            for reg, capacity in result496.items():
                if not str(reg).startswith(prefix):
                    continue
                orifice = ns["orifice_type496"](reg)
                cap_str = f"{capacity:,.0f}" if isinstance(capacity, (int, float)) else str(capacity)
                works = ns["will_work"](capacity, reg, ns["orifice_max496"](reg))
                if is_irv:
                    rows.append([orifice, cap_str, works, ns["will_irv_work496"](reg, opp_type)])
                else:
                    rows.append([orifice, cap_str, works])
            if rows:
                tables.append({"title": title, "headers": columns, "rows": rows})
        out["tables"] = tables
    except Exception as exc:
        LAST_ALGORITHM_ERROR = str(exc)
        log.exception("table build error: inlet=%s outlet=%s opp=%s", inlet_psi, outlet_psi, opp_type)
        return {
            "ok": False,
            "errors": [
                "This combination could not be sized automatically. "
                "Please contact Holland Supply Company to review the selection."
            ],
        }

    # ---- sizing adjustments ----
    adjustments = [_kv("Oversized By", f"{oversize_percent:.0f}%")]
    if apply496 and match496.get("opp") == "Monitor":
        adjustments.append(_kv("Monitor Capacity Reduction", "30%"))
    if gastypemult != 1:
        adjustments.append(_kv("Gas Type Factor", f"{gastypemult:.4f}"))
    if patm < 14.4:
        adjustments.append(_kv("Elevation capacity reduction", f"{elevation_reduction:.0f}%"))
    out["adjustments"] = adjustments

    # ---- input summary (drives the PDF; same keys and order as the original) ----
    summary = [
        _kv(f"Inlet Pressure ({payload.inlet_units})", repr(inlet_input)),
        _kv(f"Outlet Pressure ({payload.outlet_units})", repr(outlet_input)),
        _kv(f"Max Flow Rate ({payload.flow_units})", f"{flow_rate:,}"),
        _kv("Max Allowable Inlet Pressure (psi)", f"{int(maop)}"),
        _kv("Requested Pipe Size", pipesize_raw),
        _kv("Overpressure Protection Required", "Yes" if payload.opp_required else "No"),
    ]
    if payload.opp_required:
        summary.append(_kv("IRV Protect Downstream Pressure To (psi)", f"{irv_input:.1f}"))
    else:
        summary.append(_kv("Select Regulator with IRV", "Yes" if opp_type == "Partial" else "No"))
    summary.append(
        _kv(
            "Percent Load Feeding High-Efficiency Appliance",
            f"{pload_pct}%" if payload.high_efficiency else "0",
        )
    )
    summary.append(
        _kv(
            "Override percentage regulator is oversized by",
            f"{oversize_percent:.0f}%" if payload.override_oversize else "No",
        )
    )
    summary.append(_kv("Gas Type", payload.gas_type))
    # Only meaningful for "Other" - the factor is derived from it, so the PDF
    # should record what was entered.
    if payload.gas_type == "Other":
        summary.append(_kv("Specific Gravity", f"{payload.specific_gravity:.2f}"))
    summary.append(
        _kv(
            "Altitude above 3,000 feet or atmospheric pressure below 13 psi",
            "Yes" if payload.high_altitude else "No",
        )
    )
    if payload.high_altitude:
        summary.append(_kv("Atmospheric Pressure (psi)", f"{patm:.1f}"))
    out["summary"] = summary

    return out
