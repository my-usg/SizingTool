"""Python reference for wrapper.js in this folder.

The same logic the browser wrapper implements, kept in Python so the
differential test can prove the shipped JavaScript agrees with Python end to
end - unit conversion, table building and number formatting included, not just
the algorithm.

This is a direct port of the logic in the Streamlit front end (model461.py):
same rules, same message wording, same ordering.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

log = logging.getLogger("usg-sizing")

ALGORITHM = Path(__file__).resolve().parent / "algorithm.py"
_CODE = compile(ALGORITHM.read_text(encoding="utf-8"), str(ALGORITHM), "exec")

PIPE_OPTIONS = ["N/A"]   # kept for the shared options payload
INLET_UNITS = ["psi", "bar", "kPa"]
OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"]
FLOW_UNITS = ["CFH", "CMH", "BTUH"]
GAS_TYPES = ["Natural Gas", "Propane", "Other"]

# This tool has no pipe-size input and no per-register V-Port exclusions: its
# two tables come from the algorithm's own build_standard_table() and
# build_vport_table(), which return ready-made rows.
TABLE_HEADERS = ["Applicable Models", "Body", "Orifice",
                 "Qmax (CFH)", "Qmin (CFH)", "Will Reg Work"]

DEFAULTS = {
    "inlet": 0, "inlet_units": "psi",
    "outlet": 0, "outlet_units": "psi",
    "flow": 0, "min_flow": 0, "flow_units": "CFH",
    "maop": 0,
    "opp_required": False,
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
    min_flow_raw = int(payload.min_flow)
    maop = int(payload.maop)

    # ---- overpressure protection ----
    # The 441/461 offers monitor protection only - there is no IRV option.
    opp_type = "Monitor" if payload.opp_required else "None"

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
    if inlet_psi > 0 and (inlet_psi > 1000 or inlet_psi < 7 / 28):
        errors.append('Inlet pressure must be between 7" wc and 1,000 psi.')
    if outlet_psi > 0 and (outlet_psi < 2 / 28 or outlet_psi > 250):
        errors.append('Outlet pressure must be between 2" wc and 250 psi.')
    if inlet_psi > 0 and outlet_psi > 0 and outlet_psi >= inlet_psi:
        errors.append("Outlet pressure must be less than inlet pressure.")
    if int(maop) != 0 and maop < inlet_psi:
        errors.append("MAIP must be >= inlet pressure.")
    if inlet_psi == 0:
        errors.append("Inlet pressure is required.")
    if outlet_psi == 0:
        errors.append("Outlet pressure is required.")
    if flow_rate == 0:
        errors.append("Please enter a max gas load / flow rate.")
    if min_flow_raw > 0 and min_flow_raw > flow_rate:
        errors.append("Minimum flow must be \u2264 maximum flow rate.")

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
    min_flow = flow_cfh if min_flow_raw == 0 else float(min_flow_raw)
    maop_psi = inlet_psi if maop == 0 else float(maop)

    if payload.flow_units == "CMH":
        flow_cfh *= 35.3147
        min_flow *= 35.3147
    elif payload.flow_units == "BTUH":
        if payload.gas_type == "Natural Gas":
            flow_cfh /= 1000
            min_flow /= 1000
        elif payload.gas_type == "Propane":
            flow_cfh /= 2516
            min_flow /= 2516
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
        min_flow=min_flow,
        maop=maop_psi,
        opp_type=opp_type,
        oversizeby=oversizeby,
        oversize_percent=oversize_percent,
        gastypemult=gastypemult,
        pload=pload,
        Patm=patm,
    )

    try:
        # Unlike the other tools the flows are ARGUMENTS here, not just globals,
        # and the entry returns three values. The two capacity tables come from
        # their own functions rather than a shared result map.
        match461, ok461, warning461 = ns["run_regulator_selection461"](
            inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type
        )
        std_table = ns["build_standard_table"](inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type)
        vp_table = ns["build_vport_table"](inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type)
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

    warnings = [warning461] if warning461 else []

    if not match461 and result461 is None:
        return {
            "ok": True,
            "selected": False,
            "errors": [],
            "warnings": warnings,
            "message": "Model 441/461 will not work for this application.",
            "stopped": True,
        }

    # This tool returns an explicit ok flag; the original shows the error box
    # when it is false and never reads the match in that case.
    selected = bool(ok461)

    out: Dict[str, Any] = {
        "ok": True,
        "selected": selected,
        "errors": [],
        "warnings": warnings,
        "message": "Regulator selected!" if selected else "Model 441/461 will not work for this application.",
    }

    if selected:
        mon_spring = None
        if match461.get("mon_color") not in (None, "N/A"):
            mon_spring = f"{match461.get('mon_color')} {match461.get('mon_range', '')}".strip()
        raw_fields = [
            ("Model", match461.get("model")),
            ("Body Size", match461.get("body")),
            ("Orifice Size", match461.get("orifice")),
            ("Seat", match461.get("seat")),
            ("Spring", f"{match461.get('color', '')} {match461.get('range', '')}".strip()),
            ("Monitor Spring", mon_spring),
        ]
        out["selection"] = [_kv(label, value) for label, value in raw_fields if value]

        cap = match461.get("capacity")
        capacity = None
        if cap and cap != "N/A":
            try:
                capacity = f"{int(round(float(cap))):,}"
            except (TypeError, ValueError):
                capacity = str(cap)
        out["capacity"] = capacity

        pn = ns["hsc_pnc461"](match461)
        pns = pn if isinstance(pn, list) else [pn]
        out["part_numbers"] = [p for p in pns if p]

    # ---- capacity tables, grouped into labelled sections ----
    # Guarded like the selection run: will_irv_work461() can fault on spring
    # colours missing from its IRV map (see README, "Known algorithm defect"),
    # and that must produce a readable message rather than a traceback.
    try:
        def table_from(title, rows):
            """The algorithm's table functions already return the rows; this
            only formats the numbers the way table_to_df did."""
            if not rows:
                return None
            out_rows = [
                [
                    row["model"],
                    row["body"],
                    row["orifice"],
                    f"{row['qmax']:,.0f}",
                    f"{row['qmin']:,.0f}",
                    row["yn"],
                ]
                for row in rows
            ]
            return {"title": title, "headers": TABLE_HEADERS, "rows": out_rows}

        sections = []
        std_out = table_from("Standard Valves", std_table)
        if std_out:
            sections.append({"label": None, "tables": [std_out]})
        vp_out = table_from("V-Port Valves", vp_table)
        if vp_out:
            sections.append({"label": None, "tables": [vp_out]})

        out["sections"] = sections
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

    # Shown above the tables when a monitor is in play.
    out["tables_caption"] = (
        "Capacity reduction due to monitor shown." if opp_type != "None" else None
    )

    # ---- sizing adjustments ----
    adjustments = [_kv("Oversized By", f"{oversize_percent:.0f}%")]
    if selected and match461.get("opp") == "Monitor":
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
        _kv(f"Min Flow Rate ({payload.flow_units})", f"{min_flow:,}"),
        _kv("Max Allowable Inlet Pressure (psi)", f"{int(maop)}"),
        _kv("Overpressure Protection Required", "Yes" if payload.opp_required else "No"),
    ]
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
