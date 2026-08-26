#!/usr/bin/env python3
"""Find inputs that make an algorithm fault, for every tool.

    python3 build/fault_sweep.py [slug ...]

A "fault" is an exception raised inside the algorithm itself - a spring colour
missing from a lookup table, an orifice outside its range, and so on. The web
tools catch these and show "contact Holland Supply Company", so they are not
crashes, but they are inputs the tool cannot answer.

This walks each tool's declared input ranges on a grid and reports the envelope
of the faults it finds, so the defects can be fixed deliberately rather than
discovered by customers.
"""

from __future__ import annotations

import importlib.util
import json
import logging
import sys
from itertools import product
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
logging.getLogger("usg-sizing").setLevel(logging.CRITICAL)

FAULT_MESSAGE = "could not be sized automatically"


def load_reference(tool_dir: Path):
    spec = importlib.util.spec_from_file_location(
        f"ref_{tool_dir.name.replace('-', '_')}", tool_dir / "reference.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def grid(lo: float, hi: float, n: int) -> list[float]:
    if n <= 1:
        return [lo]
    step = (hi - lo) / (n - 1)
    return [round(lo + i * step, 4) for i in range(n)]


def sweep(tool_dir: Path) -> list[dict]:
    cfg = json.loads((tool_dir / "tool.json").read_text())
    scenarios = json.loads((tool_dir / "scenarios.json").read_text())
    spec = scenarios.get("random", {})
    reference = load_reference(tool_dir)

    # Sweep in psi over the tool's own psi range, so the grid is meaningful.
    inlet_range = spec["inlet"]["float_by"]["ranges"]["psi"]
    outlet_range = spec["outlet"]["float_by"]["ranges"]["psi"]
    inlets = grid(inlet_range[0], inlet_range[1], 26)
    outlets = grid(outlet_range[0], outlet_range[1], 26)

    # Protection modes this tool actually offers.
    modes: list[dict] = [{}, {"partial_irv": True}]
    if "opp_pref" in spec:
        modes += [
            {"opp_required": True, "opp_pref": "IRV", "irv_pressure": 2.0},
            {"opp_required": True, "opp_pref": "Monitor"},
        ]
    else:
        modes += [{"opp_required": True, "irv_pressure": 2.0}]
    modes = [m for m in modes if all(k in spec or k == "irv_pressure" for k in m)] or [{}]

    flows = [500, 5000, 50000, 400000]
    faults = []
    for inlet, outlet, mode, flow in product(inlets, outlets, modes, flows):
        if outlet >= inlet:
            continue
        case = {"inlet": inlet, "outlet": outlet, "flow": flow}
        case.update(mode)
        try:
            result = reference.run(case)
        except Exception as exc:  # the reference should never escape
            faults.append({"case": case, "error": f"ESCAPED {type(exc).__name__}: {exc}"})
            continue
        if not result.get("ok") and any(FAULT_MESSAGE in e for e in result.get("errors", [])):
            faults.append({"case": case, "error": reference.LAST_ALGORITHM_ERROR})
    return faults


def describe(slug: str, faults: list[dict]) -> None:
    if not faults:
        print(f"  {slug:12} no algorithm faults found")
        return
    errors: dict[str, list[dict]] = {}
    for f in faults:
        errors.setdefault(str(f["error"]), []).append(f["case"])
    print(f"  {slug:12} {len(faults)} faulting inputs, {len(errors)} distinct cause(s)")
    for err, cases in sorted(errors.items(), key=lambda kv: -len(kv[1])):
        inlets = [c["inlet"] for c in cases]
        outlets = [c["outlet"] for c in cases]
        opps = sorted({c.get("opp_pref", "IRV" if c.get("opp_required") else
                             ("Partial" if c.get("partial_irv") else "None")) for c in cases})
        print(f"      cause: {err}")
        print(f"        {len(cases)} inputs | inlet {min(inlets)}-{max(inlets)} psi"
              f" | outlet {min(outlets)}-{max(outlets)} psi | protection: {', '.join(opps)}")
        print(f"        example: {json.dumps(cases[0])}")


def main() -> int:
    slugs = sys.argv[1:]
    tools_dir = ROOT / "tools"
    dirs = ([tools_dir / s for s in slugs] if slugs
            else sorted(p.parent for p in tools_dir.glob("*/tool.json")))
    total = 0
    print("Algorithm fault sweep\n")
    for d in dirs:
        faults = sweep(d)
        total += len(faults)
        describe(d.name, faults)
    print(f"\n{total} faulting inputs across {len(dirs)} tools")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
