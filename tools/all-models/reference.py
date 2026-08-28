"""Python reference for wrapper.js in this folder.

This is the same logic the browser wrapper implements, kept in Python so the
differential test can prove the shipped JavaScript agrees with Python end to
end - unit conversion and formatting included, not just the algorithm.

Originally:

The unit conversions, validation rules, oversize maths and result formatting all
live here so the website block stays a dumb form: it posts the raw field values
and renders whatever comes back. This is a direct port of the logic in
``allmodels.py`` (the Streamlit front end) - same rules, same message wording,
same ordering.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional


log = logging.getLogger("usg-sizing")

ALGORITHM = Path(__file__).resolve().parent / "algorithm.py"
_CODE = compile(ALGORITHM.read_text(encoding="utf-8"), str(ALGORITHM), "exec")


class SizingError(RuntimeError):
    pass


# Set to the exception message when the algorithm itself faults, so the
# differential test can require both languages to fail identically.
LAST_ALGORITHM_ERROR = None


def _select(**kw):  # noqa: C901
    """Run the algorithm in a fresh namespace (mirrors the browser's globals)."""
    ns: Dict[str, Any] = {}
    exec(_CODE, ns)
    ns.update(
        inlet_input=kw["inlet_psi"], outlet_input=kw["outlet_psi"],
        flow_rate=kw["flow_cfh"], min_flow=kw["minflow_cfh"], maop=kw["maop_psi"],
        pipesize_input=kw["pipesize_input"], opp_type=kw["opp_type"],
        irv_input=kw["irv_input"], oversizeby=kw["oversizeby"],
        gastypemult=kw["gastypemult"], pload=kw["pload"],
        combust_pref=kw["combust_pref"], Patm=kw["patm"],
    )
    global LAST_ALGORITHM_ERROR
    try:
        match, model_selection, warning, pn, pipe_req = ns["allmodels_selector"](
            kw["inlet_psi"], kw["outlet_psi"], kw["opp_type"])
    except Exception as exc:
        LAST_ALGORITHM_ERROR = str(exc)
        raise SizingError(str(exc)) from exc
    return {"match": match, "model_selection": model_selection, "warning": warning,
            "part_number": pn, "pipe_requirement": pipe_req}

PIPE_OPTIONS = [
    "N/A",
    '3/8"',
    '1/2"',
    '3/4"',
    '1"',
    '1-1/4"',
    '1-1/2"',
    '2"',
    '2-1/2"',
    '3"',
]

INLET_UNITS = ["psi", "bar", "kPa"]
OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"]
FLOW_UNITS = ["CFH", "CMH", "BTUH"]
GAS_TYPES = ["Natural Gas", "Propane", "Other"]
OPP_PREFS = ["IRV", "Monitor"]


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
    return {"label": label, "value": str(value)}


DEFAULTS = {
    "inlet": 0, "inlet_units": "psi", "outlet": 0, "outlet_units": "psi",
    "flow": 0, "min_flow": 0, "flow_units": "CFH", "maop": 0,
    "pipe_size": "N/A", "opp_required": False, "opp_pref": "IRV",
    "irv_pressure": 2.0, "partial_irv": False,
    "high_efficiency": False, "high_efficiency_pct": 100,
    "override_oversize": False, "oversize_pct": 25, "prefer_combustion": False,
    "gas_type": "Natural Gas", "specific_gravity": 0.6,
    "high_altitude": False, "atmospheric_pressure": 14.40,
}


class _P:
    """Attribute access over a plain dict, with the same defaults as the JS."""

    def __init__(self, d):
        merged = dict(DEFAULTS)
        merged.update({k: v for k, v in (d or {}).items() if v is not None})
        self.__dict__.update(merged)


def run(payload) -> Dict[str, Any]:
    """Take input values, return the same object shape as the JS wrapper."""
    global LAST_ALGORITHM_ERROR
    LAST_ALGORITHM_ERROR = None
    if isinstance(payload, dict):
        payload = _P(payload)

    # Match the widget types of the original tool: pressures are floats,
    # flows and MAIP are whole numbers.
    inlet_input = float(payload.inlet)
    outlet_input = float(payload.outlet)
    flow_rate = int(payload.flow)
    min_flow_raw = int(payload.min_flow)
    maop = int(payload.maop)

    min_flow = flow_rate if min_flow_raw == 0 else min_flow_raw

    pipesize_raw = payload.pipe_size
    pipesize_input = 0 if pipesize_raw == "N/A" else pipesize_raw

    # ---- overpressure protection ----
    irv_input = 0.0
    opp_type = "None"
    opp_pref = ""
    if payload.opp_required:
        opp_pref = payload.opp_pref
        if opp_pref == "IRV":
            irv_input = payload.irv_pressure
            opp_type = "IRV"
        else:
            opp_type = "Monitor"
    else:
        if payload.partial_irv:
            opp_type = "Partial"

    # ---- oversizing ----
    pload = 0.0
    pload_pct = 0
    if payload.high_efficiency:
        pload_pct = payload.high_efficiency_pct
        pload = pload_pct / 100.0
    oversizeby = 1.25 + (0.75 * pload)
    if payload.override_oversize:
        oversizeby = 1 + (payload.oversize_pct / 100)
    oversize_percent = (oversizeby - 1) * 100

    combust_pref = payload.prefer_combustion

    # ---- gas type ----
    gastypemult = 1.0
    if payload.gas_type == "Propane":
        gastypemult = 0.63
    elif payload.gas_type == "Other":
        gastypemult = min(1.0, (0.6 / payload.specific_gravity) ** 0.5)

    patm = payload.atmospheric_pressure if payload.high_altitude else 14.4

    inlet_psi = to_psi(inlet_input, payload.inlet_units)
    outlet_psi = to_psi(outlet_input, payload.outlet_units)

    # ---- validation (same rules, same wording, same order as the Streamlit app) ----
    errors: List[str] = []
    if inlet_psi == 0:
        errors.append("Inlet pressure is required.")
    if outlet_psi == 0:
        errors.append("Outlet pressure is required.")
    if flow_rate == 0:
        errors.append("Please enter a max gas load / flow rate.")
    if inlet_psi > 0 and (inlet_psi > 1000 or inlet_psi < 0.25):
        errors.append(
            'Inlet pressure must be between 7" wc (0.25 psi / 0.017 bar) and 1,000 psi.'
        )
    if outlet_psi > 0 and (outlet_psi < 1.5 / 28 or outlet_psi > 250):
        errors.append('Outlet pressure must be between 1.5" wc and 250 psi.')
    if inlet_psi > 0 and outlet_psi > 0 and outlet_psi >= inlet_psi:
        errors.append("Outlet pressure must be less than inlet pressure.")
    if int(maop) != 0 and maop < inlet_psi:
        errors.append("MAIP must be >= inlet pressure.")
    if min_flow > flow_rate:
        errors.append("Minimum flow must be \u2264 maximum flow rate.")
    if inlet_psi > 0 and outlet_psi > 0 and inlet_psi > 175 and outlet_psi < 3:
        errors.append("Pressure differential too large \u2014 consider two pressure cuts.")

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
    minflow_cfh = float(min_flow)
    maop_psi = inlet_psi if maop == 0 else float(maop)

    if payload.flow_units == "CMH":
        flow_cfh *= 35.3147
        minflow_cfh *= 35.3147
    elif payload.flow_units == "BTUH":
        if payload.gas_type == "Natural Gas":
            flow_cfh /= 1000
            minflow_cfh /= 1000
        elif payload.gas_type == "Propane":
            flow_cfh /= 2516
            minflow_cfh /= 2516
        else:
            return {
                "ok": False,
                "errors": [
                    "BTUH conversion is only supported for Natural Gas or Propane. "
                    "Please enter flow rate in CFH or CMH."
                ],
            }

    # ---- run the algorithm ----
    # Known defect in the sizing script (see README "Known algorithm defect"):
    # monitor sizing with an outlet between 85 and 100 psi computes a monitor
    # setpoint above the top of the 57S spring table, spring_57S() returns the
    # string 'N/A', and the caller subscripts it. Rather than patch the
    # algorithm (it is kept byte-identical to the original), return a clean
    # message and log it loudly so the case can be picked up manually.
    try:
        out = _select(
            inlet_psi=inlet_psi,
            outlet_psi=outlet_psi,
            flow_cfh=flow_cfh,
            minflow_cfh=minflow_cfh,
            maop_psi=maop_psi,
            pipesize_input=pipesize_input,
            opp_type=opp_type,
            irv_input=irv_input,
            oversizeby=oversizeby,
            gastypemult=gastypemult,
            pload=pload,
            combust_pref=combust_pref,
            patm=patm,
        )
    except SizingError:
        log.exception(
            "algorithm error: inlet=%s outlet=%s flow=%s opp=%s",
            inlet_psi,
            outlet_psi,
            flow_cfh,
            opp_type,
        )
        return {
            "ok": False,
            "errors": [
                "This combination could not be sized automatically. "
                "Please contact Holland Supply Company to review the selection."
            ],
        }

    match = out["match"]
    model_selection = out["model_selection"]
    warning = out["warning"]
    part_number = out["part_number"]
    pipe_requirement = out["pipe_requirement"]

    warnings: List[str] = [warning] if warning else []

    if not model_selection:
        return {
            "ok": True,
            "selected": False,
            "errors": [],
            "warnings": warnings,
            "message": "No USG regulators will work for this application.",
            }

    # ---- selection fields (same order and N/A filtering as the Streamlit app) ----
    def _spring(color_key: str, range_key: str) -> Optional[str]:
        color = match.get(color_key)
        if color in (None, "N/A"):
            return None
        return f"{color} {match.get(range_key, '')}".strip()

    mon_diap = match.get("mon_diap")
    if mon_diap in (None, "N/A"):
        mon_diap = None

    raw_fields = [
        ("Model", match.get("model")),
        ("Diaphragm Size", match.get("diap")),
        ("Body Size", match.get("body")),
        ("Orifice Size", match.get("orifice")),
        ("Seat", match.get("seat")),
        ("Spring", f"{match.get('color', '')} {match.get('range', '')}".strip()),
        ("Monitor Spring", _spring("mon_color", "mon_range")),
        ("Monitor Diaphragm", mon_diap),
    ]
    selection = [_kv(label, value) for label, value in raw_fields if value]

    capacity = match.get("capacity")
    capacity_str = None
    if capacity and capacity != "N/A":
        try:
            capacity_str = f"{int(round(float(capacity))):,}"
        except (TypeError, ValueError):
            capacity_str = str(capacity)

    # hsc_pnc* now return a dict: worker, an optional monitor, and an optional
    # control line kit with its quantity.
    part_numbers = [
        part_number.get("worker"),
        part_number.get("monitor"),
    ]
    part_numbers = [p for p in part_numbers if p]

    # The control line kit is reported separately: it is not a regulator, so it
    # stays out of part_numbers (which drives the cart and the PDF).
    control_line = part_number.get("controlline") or None
    control_line_qty = part_number.get("controllineqty")

    # ---- sizing adjustments ----
    adjustments = [_kv("Oversized By", f"{oversize_percent:.0f}%")]
    if match.get("opp") == "Monitor":
        adjustments.append(_kv("Monitor Capacity Reduction", "30%"))
    if gastypemult != 1:
        adjustments.append(_kv("Gas Type Factor", f"{gastypemult:.4f}"))
    if patm < 14.4:
        adjustments.append(_kv("Elevation capacity reduction", f"{elevation_reduction:.0f}%"))

    # ---- input summary (used by the PDF; same keys and order as the Streamlit app) ----
    summary = [
        _kv(f"Inlet Pressure ({payload.inlet_units})", repr(inlet_input)),
        _kv(f"Outlet Pressure ({payload.outlet_units})", repr(outlet_input)),
        _kv(f"Max Flow Rate ({payload.flow_units})", f"{flow_rate:,}"),
        _kv(f"Min Flow Rate ({payload.flow_units})", f"{min_flow:,}"),
        _kv("Max Allowable Inlet Pressure (psi)", f"{int(maop)}"),
        _kv("Requested Pipe Size", pipesize_raw),
        _kv("Overpressure Protection Required", "Yes" if payload.opp_required else "No"),
    ]
    if not payload.opp_required:
        summary.append(_kv("Select Regulator with IRV", "Yes" if opp_type == "Partial" else "No"))
    else:
        summary.append(_kv("Protection Type", opp_pref))
        if opp_pref == "IRV":
            summary.append(_kv("IRV Protect Downstream Pressure To (psi)", f"{irv_input:.1f}"))
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
    summary.append(_kv("Combustion Regulator Preferred", "Yes" if combust_pref else "No"))
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

    return {
        "ok": True,
        "selected": True,
        "errors": [],
        "warnings": warnings,
        "message": "Regulator selected!",
        "selection": selection,
        "capacity": capacity_str,
        "part_numbers": part_numbers,
        "control_line": control_line,
        "control_line_qty": control_line_qty,
        "pipe_note": pipe_requirement or None,
        "adjustments": adjustments,
        "summary": summary,
    }
