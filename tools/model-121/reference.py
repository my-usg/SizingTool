"""Python reference for wrapper.js in this folder.

The same logic the browser wrapper implements, kept in Python so the
differential test can prove the shipped JavaScript agrees with Python end to
end - unit conversion, table building and number formatting included, not just
the algorithm.

This is a direct port of the logic in the Streamlit front end (model121.py):
same rules, same message wording, same ordering.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List

log = logging.getLogger("usg-sizing")

ALGORITHM = Path(__file__).resolve().parent / "algorithm.py"
_CODE = compile(ALGORITHM.read_text(encoding="utf-8"), str(ALGORITHM), "exec")

PIPE_OPTIONS = ["N/A", '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"']
INLET_UNITS = ["psi", "bar", "kPa"]
OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"]
FLOW_UNITS = ["CFH", "CMH", "BTUH"]
GAS_TYPES = ["Natural Gas", "Propane", "Other"]

# Registers with no V-Port variant, dropped from the V-Port tables
# (matches _VP_EXCLUDE in the Streamlit app).
VP_EXCLUDE = {"R1210813", "R121081Q", "R1211230", "R1211630", "R121HP13", "R121HP1Q"}

# Models whose selection carries an outlet pipe sizing requirement.
PIPE_NOTE_MODELS = ["121-8", "121-12", "121-16", "121-HP"]

DEFAULTS = {
    "inlet": 0, "inlet_units": "psi",
    "outlet": 0, "outlet_units": "psi",
    "flow": 0, "min_flow": 0, "flow_units": "CFH",
    "maop": 0,
    "pipe_size": "N/A",
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

    pipesize_raw = payload.pipe_size
    pipesize_input = 0 if pipesize_raw == "N/A" else pipesize_raw

    # ---- overpressure protection ----
    # The 121/122 offers monitor protection only - there is no IRV option.
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
    if inlet_psi > 0 and (inlet_psi > 60 or inlet_psi < 8 / 28):
        errors.append('Inlet pressure must be between 8" wc and 60 psi.')
    if outlet_psi > 0 and (outlet_psi < 1.5 / 28 or outlet_psi > 10):
        errors.append('Outlet pressure must be between 1.5" wc and 10 psi.')
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
        pipesize_input=pipesize_input,
        opp_type=opp_type,
        irv_input=0,
        oversizeby=oversizeby,
        oversize_percent=oversize_percent,
        gastypemult=gastypemult,
        pload=pload,
        Patm=patm,
    )

    try:
        # Six return values, unlike the other tools: the standard result map,
        # the V-Port map, the 122 map, then the selection.
        (
            result121,
            result121_VP,
            result122,
            match121,
            apply121,
            warning121,
        ) = ns["run_regulator_selection121"](inlet_psi, outlet_psi, opp_type)
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

    warnings = [warning121] if warning121 else []

    if not match121 and result121 is None:
        return {
            "ok": True,
            "selected": False,
            "errors": [],
            "warnings": warnings,
            "message": "Model 121/122 will not work for this application.",
            "stopped": True,
        }

    # The original keys the selection block off match121 being truthy, not off
    # apply121 - keep that, because they can differ.
    selected = bool(match121)

    out: Dict[str, Any] = {
        "ok": True,
        "selected": selected,
        "errors": [],
        "warnings": warnings,
        "message": "Regulator selected!" if selected else "Model 121/122 will not work for this application.",
    }

    if selected:
        mon_spring = None
        if match121.get("mon_color"):
            mon_spring = f"{match121.get('mon_color')} {match121.get('mon_range', '')}".strip()
        raw_fields = [
            ("Model", match121.get("model")),
            ("Body Size", match121.get("body")),
            ("Orifice Size", match121.get("orifice")),
            ("Seat", match121.get("seat")),
            ("Spring", f"{match121.get('color', '')} {match121.get('range', '')}".strip()),
            ("Monitor Spring", mon_spring),
        ]
        out["selection"] = [_kv(label, value) for label, value in raw_fields if value]

        cap = match121.get("capacity")
        capacity = None
        if cap and cap != "N/A":
            try:
                capacity = f"{int(round(float(cap))):,}"
            except (TypeError, ValueError):
                capacity = str(cap)
        out["capacity"] = capacity

        # ---- outlet pipe sizing note ----
        out["pipe_note"] = None
        model_name = str(match121.get("model") or "")
        for marker in PIPE_NOTE_MODELS:
            if marker in model_name:
                try:
                    pipe_req = ns["body_size_min121"](ip=inlet_psi, reg=match121["reg"])
                except Exception:
                    pipe_req = None
                if pipe_req:
                    out["pipe_note"] = (
                        "Model 121 regulators have outlet pipe sizing requirements. "
                        f"This regulator was sized for use with {pipe_req} outlet pipe. "
                        "For capacities with smaller outlet piping, see regulator brochure."
                    )
                break

        pn = ns["hsc_pnc121"](match121)
        pns = pn if isinstance(pn, list) else [pn]
        out["part_numbers"] = [p for p in pns if p]

    # ---- capacity tables, grouped into labelled sections ----
    # Guarded like the selection run: will_irv_work121() can fault on spring
    # colours missing from its IRV map (see README, "Known algorithm defect"),
    # and that must produce a readable message rather than a traceback.
    try:
        def build_table(title, prefix, result_map, vp):
            """One table. Rows list the BODY size, not an orifice, and the
            V-Port variants drop the excluded registers."""
            rows = []
            for reg, capacity in result_map.items():
                if not str(reg).startswith(prefix):
                    continue
                if vp and str(reg) in VP_EXCLUDE:
                    continue
                body = ns["body_type121"](reg)
                cap_str = f"{capacity:,.0f}" if isinstance(capacity, (int, float)) else str(capacity)
                works = ns["will_work_vp"](capacity, reg, vp)
                rows.append([body, cap_str, works])
            if not rows:
                return None  # Streamlit skipped empty frames
            return {
                "title": title,
                "headers": ["Body Size", "Calculated Capacity (CFH)", "Will Reg Work"],
                "rows": rows,
            }

        sections = []

        def add_section(label, entries):
            tables = [t for t in (build_table(*e) for e in entries) if t]
            if tables:
                sections.append({"label": label, "tables": tables})

        # Which models appear depends on the outlet pressure and whether a
        # monitor is used. Same conditions and order as the Streamlit app.
        show_122 = not isinstance(result122, str) and (
            (outlet_psi <= 2 and opp_type != "Monitor")
            or (outlet_psi <= 1 and opp_type == "Monitor")
        )

        if show_122:
            # Standard + V-Port + the 122 models
            add_section("Standard Valves", [
                ("Model 121-8", "R12108", result121, False),
                ("Model 121-12", "R12112", result121, False),
                ("Model 121-16", "R12116", result121, False),
                ("Model 122-8", "R12208", result122, False),
                ("Model 122-12", "R12212", result122, False),
            ])
            add_section("V-Port Valves", [
                ("Model 121-8", "R12108", result121_VP, True),
                ("Model 121-12", "R12112", result121_VP, True),
            ])
        elif outlet_psi <= 3:
            # Standard + V-Port, no 122
            add_section("Standard Valves", [
                ("Model 121-8", "R12108", result121, False),
                ("Model 121-12", "R12112", result121, False),
                ("Model 121-16", "R12116", result121, False),
            ])
            add_section("V-Port Valves", [
                ("Model 121-8", "R12108", result121_VP, True),
                ("Model 121-12", "R12112", result121_VP, True),
            ])
        else:
            # High-pressure models only
            add_section("Standard Valves", [("Model 121-8-HP", "R121HP", result121, False)])
            add_section("V-Port Valves", [("Model 121-HP", "R121HP", result121_VP, True)])

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
    if selected and match121.get("opp") == "Monitor":
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
        _kv("Requested Pipe Size", pipesize_raw),
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
    # Only meaningful for "Other" - the factor is derived from it, so the PDF
    # should record what was entered. Sits directly after Gas Type, as in every
    # other tool.
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

    # The PDF button is keyed off apply121, which can differ from match121.
    out["can_download"] = bool(apply121)

    return out
