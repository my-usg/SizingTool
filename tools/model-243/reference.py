"""Python reference for wrapper.js in this folder.

The same logic the browser wrapper implements, kept in Python so the
differential test can prove the shipped JavaScript agrees with Python end to
end - unit conversion, table building and number formatting included, not just
the algorithm.

This is a direct port of the logic in the Streamlit front end (model243.py):
same rules, same message wording, same ordering.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

log = logging.getLogger("usg-sizing")

ALGORITHM = Path(__file__).resolve().parent / "algorithm.py"
_CODE = compile(ALGORITHM.read_text(encoding="utf-8"), str(ALGORITHM), "exec")

PIPE_OPTIONS = ["N/A", '1-1/4"', '1-1/2"', '2"']
INLET_UNITS = ["psi", "bar", "kPa"]
OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"]
FLOW_UNITS = ["CFH", "CMH", "BTUH"]
GAS_TYPES = ["Natural Gas", "Propane", "Other"]

# The 243 tabulates several regulator families. Which set is shown depends on
# the outlet pressure and the protection type - see the branch chain below.
STD_IRV_BODIES = [
    ('Model 243-8, 1-1/4" Body', "R243081Q"),
    ('Model 243-8, 1-1/2" Body', "R243081H"),
    ('Model 243-8, 2" Body', "R2430802"),
    ('Model 243-12, 1-1/4" Body', "R243121Q"),
    ('Model 243-12, 1-1/2" Body', "R243121H"),
    ('Model 243-12, 2" Body', "R2431202"),
]
STD_MON_BODIES = STD_IRV_BODIES + [
    ("Model 243-12-1 with External Control Line", "R24312EX"),
]
STD_243_8_BODIES = [
    ('Model 243-8, 1-1/4" Body', "R243081Q"),
    ('Model 243-8, 1-1/2" Body', "R243081H"),
    ('Model 243-8, 2" Body', "R2430802"),
]
HP_BODIES = [
    ('Model 243-8HP, 1-1/4" Body', "R243HP1Q"),
    ('Model 243-8HP, 1-1/2" Body', "R243HP1H"),
    ('Model 243-8HP, 2" Body', "R243HP02"),
]

DEFAULTS = {
    "inlet": 0, "inlet_units": "psi",
    "outlet": 0, "outlet_units": "psi",
    "flow": 0, "flow_units": "CFH",
    "maop": 0,
    "pipe_size": "N/A",
    "opp_required": False, "opp_pref": "IRV", "irv_pressure": 2.0, "partial_irv": False,
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
    opp_pref = ""
    if payload.opp_required:
        opp_pref = payload.opp_pref
        if opp_pref == "IRV":
            irv_input = float(payload.irv_pressure)
            opp_type = "IRV"
        else:
            opp_type = "Monitor"
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
    if inlet_psi > 0 and (inlet_psi > 125 or inlet_psi < 0.5):
        errors.append("Inlet pressure must be between 0.5 and 125 psi.")
    if outlet_psi > 0 and (outlet_psi < 3.5 / 28 or outlet_psi > 10):
        errors.append('Outlet pressure must be between 3.5" wc and 10 psi.')
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
    )

    try:
        result243, match243, apply243, warning243 = ns["run_regulator_selection243"](
            inlet_psi, outlet_psi, opp_type
        )
        # Mirrors the Streamlit app: an IRV request at 2 psi or more outlet
        # needs the high-pressure data, so the TABLES are drawn as monitor from
        # here on. The selection above was already made with the original
        # opp_type.
        table_opp = opp_type
        if table_opp == "IRV" and outlet_psi >= 2:
            table_opp = "Monitor"

        results_irv = ns["interpolate_capacity"](ns["stddata243"], inlet_psi, outlet_psi, False, False)
        result_mon = ns["interpolate_capacity"](ns["stddata243"], inlet_psi, outlet_psi, True, False)
        result_hp_mon = ns["interpolate_capacity"](ns["hpdata243"], inlet_psi, outlet_psi, True, False)
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

    warnings = [warning243] if warning243 else []

    if not apply243 and result243 is None:
        return {
            "ok": True,
            "selected": False,
            "errors": [],
            "warnings": warnings,
            "message": "Model 243 will not work for this application.",
            "stopped": True,
        }

    out: Dict[str, Any] = {
        "ok": True,
        "selected": bool(apply243),
        "errors": [],
        "warnings": warnings,
        "message": "Regulator selected!" if apply243 else "Model 243 will not work for this application.",
    }

    if apply243:
        mon_spring = None
        if match243.get("mon_color"):
            mon_spring = f"{match243.get('mon_color')} {match243.get('mon_range', '')}".strip()
        raw_fields = [
            ("Model", match243.get("model")),
            ("Diaphragm", match243.get("diap")),
            ("Body Size", match243.get("body")),
            ("Orifice Size", match243.get("orifice")),
            ("Seat", match243.get("seat")),
            ("Spring", f"{match243.get('color', '')} {match243.get('range', '')}".strip()),
            ("Monitor Spring", mon_spring),
        ]
        out["selection"] = [_kv(label, value) for label, value in raw_fields if value]

        cap = match243.get("capacity")
        capacity = None
        if cap and cap != "N/A":
            try:
                capacity = f"{int(round(float(cap))):,}"
            except (TypeError, ValueError):
                capacity = str(cap)
        out["capacity"] = capacity

        pn = ns["hsc_pnc243"](match243)
        pns = pn if isinstance(pn, list) else [pn]
        out["part_numbers"] = [p for p in pns if p]

    # ---- capacity tables, grouped into labelled sections ----
    # Guarded like the selection run: will_irv_work243() can fault on spring
    # colours missing from its IRV map (see README, "Known algorithm defect"),
    # and that must produce a readable message rather than a traceback.
    try:
        def build_table(title, prefix, table_opp, result_map):
            is_irv = table_opp == "IRV"
            rows = []
            for reg, capacity in result_map.items():
                if not str(reg).startswith(prefix):
                    continue
                orifice = ns["orifice_type243"](reg)
                cap_str = f"{capacity:,.0f}" if isinstance(capacity, (int, float)) else str(capacity)
                works = ns["will_work"](capacity, reg, ns["orifice_max243"](reg))
                if is_irv:
                    rows.append([orifice, cap_str, works, ns["will_irv_work243"](reg, table_opp)])
                else:
                    rows.append([orifice, cap_str, works])
            if not rows:
                return None  # Streamlit skipped empty frames
            headers = ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work"] + (
                ["Will IRV Work"] if is_irv else []
            )
            return {"title": title, "headers": headers, "rows": rows}

        sections = []

        def add_section(label, bodies, table_opp, result_map):
            tables = [t for t in (build_table(t_, p_, table_opp, result_map) for t_, p_ in bodies) if t]
            if tables:
                sections.append({"label": label, "tables": tables})

        # Which set is shown depends on the outlet pressure and the protection
        # type. This is the same if/elif chain the Streamlit app used, in the
        # same order - order matters, because several conditions overlap.
        if outlet_psi <= 3 and table_opp in ("None", "Partial"):
            # Standard tables - 243-8 and 243-12
            add_section(None, STD_MON_BODIES, table_opp, result243)
        elif outlet_psi <= 5 and table_opp in ("None", "Partial"):
            # Standard tables - 243-8 only
            add_section(None, STD_243_8_BODIES, table_opp, result243)
        elif table_opp == "IRV":
            add_section("With IRV", STD_IRV_BODIES, "IRV", results_irv)
            add_section("With Monitor", STD_MON_BODIES, "Monitor", result_mon)
        elif outlet_psi <= 2 and table_opp == "Monitor":
            add_section("With Monitor", STD_MON_BODIES, "Monitor", result_mon)
        elif outlet_psi <= 3 and table_opp == "Monitor":
            add_section("With Monitor", STD_243_8_BODIES, "Monitor", result_mon)
        elif outlet_psi > 5 and table_opp in ("None", "Partial"):
            # High-pressure standard tables
            add_section(None, HP_BODIES, table_opp, result243)
        elif outlet_psi > 3 and table_opp == "Monitor":
            # High-pressure monitor tables
            add_section("With Monitor", HP_BODIES, "Monitor", result_hp_mon)

        out["sections"] = sections
    except Exception as exc:
        LAST_ALGORITHM_ERROR = str(exc)
        log.exception("table build error: inlet=%s outlet=%s opp=%s", inlet_psi, outlet_psi, table_opp)
        return {
            "ok": False,
            "errors": [
                "This combination could not be sized automatically. "
                "Please contact Holland Supply Company to review the selection."
            ],
        }

    # ---- sizing adjustments ----
    adjustments = [_kv("Oversized By", f"{oversize_percent:.0f}%")]
    if apply243 and match243.get("opp") == "Monitor":
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
    if not payload.opp_required:
        summary.append(_kv("Select Regulator with IRV", "Yes" if opp_type == "Partial" else "No"))
    else:
        summary.append(_kv("Protection Type", "IRV" if opp_pref == "IRV" else "Monitor"))
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
