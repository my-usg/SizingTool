#!/usr/bin/env python3
"""Prove a tool's shipped JavaScript matches its Python, end to end.

    python3 build/difftest.py                     # every tool
    python3 build/difftest.py all-models          # one tool
    python3 build/difftest.py --cases 2500 --seeds 4

For each generated input this runs:

    Python:     tools/<slug>/reference.py  ->  tools/<slug>/algorithm.py
    JavaScript: dist/<output>               (the exact file the website loads)

and compares the ENTIRE result object - selection fields, capacity, part
numbers, warnings, adjustments, input summary and error messages. Any
difference fails the build, so a mistranslation cannot reach the website.

This covers the whole pipeline, not just the algorithm: unit conversion,
validation wording and ordering, number formatting and rounding are all
included, because those live in the tool's wrapper.js and can drift too.

Generated inputs come from tools/<slug>/scenarios.json ("edge_cases") plus a
randomiser seeded per run, so every branch of the form is exercised.
"""

from __future__ import annotations

import argparse
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

import importlib.util  # noqa: E402
import logging  # noqa: E402

# Algorithm faults are caught and reported as normal results; their tracebacks
# would otherwise flood the output.
logging.getLogger("usg-sizing").setLevel(logging.CRITICAL)


def load_reference(tool_dir: Path):
    """Import tools/<slug>/reference.py as a module."""
    spec = importlib.util.spec_from_file_location(
        f"reference_{tool_dir.name.replace('-', '_')}", tool_dir / "reference.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def discover(slugs):
    tools_dir = ROOT / "tools"
    if slugs:
        dirs = []
        for slug in slugs:
            d = tools_dir / slug
            if not (d / "tool.json").exists():
                sys.exit(f"no such tool: {slug}")
            dirs.append(d)
        return dirs
    found = sorted(p.parent for p in tools_dir.glob("*/tool.json"))
    if not found:
        sys.exit("no tools found")
    return found

PIPE_OPTIONS = ["N/A", '3/8"', '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"']


def random_case(rng: random.Random) -> dict:
    inlet_units = rng.choice(["psi", "bar", "kPa"])
    outlet_units = rng.choice(["psi", "in wc", "oz", "bar", "kPa"])

    if inlet_units == "bar":
        inlet = round(rng.uniform(0.02, 69), 3)
    elif inlet_units == "kPa":
        inlet = round(rng.uniform(2, 1000), 1)
    else:
        inlet = round(rng.uniform(0.2, 1000), 2)

    if outlet_units == "in wc":
        outlet = round(rng.uniform(1.0, 200), 1)
    elif outlet_units == "oz":
        outlet = round(rng.uniform(0.5, 500), 1)
    elif outlet_units == "bar":
        outlet = round(rng.uniform(0.003, 18), 4)
    elif outlet_units == "kPa":
        outlet = round(rng.uniform(0.3, 1000), 1)
    else:
        outlet = round(rng.uniform(0.05, 260), 2)

    return {
        "inlet": inlet, "inlet_units": inlet_units,
        "outlet": outlet, "outlet_units": outlet_units,
        "flow": rng.randint(0, 900000),
        "min_flow": rng.choice([0, 0, 0, rng.randint(1, 5000)]),
        "flow_units": rng.choice(["CFH", "CFH", "CMH", "BTUH"]),
        "maop": rng.choice([0, 0, rng.randint(1, 1000)]),
        "pipe_size": rng.choice(PIPE_OPTIONS),
        "opp_required": rng.random() < 0.5,
        "opp_pref": rng.choice(["IRV", "Monitor"]),
        "irv_pressure": round(rng.uniform(0, 10), 1),
        "partial_irv": rng.random() < 0.3,
        "high_efficiency": rng.random() < 0.4,
        "high_efficiency_pct": rng.randint(0, 100),
        "override_oversize": rng.random() < 0.3,
        "oversize_pct": rng.randint(0, 100),
        "prefer_combustion": rng.random() < 0.3,
        "gas_type": rng.choice(["Natural Gas", "Natural Gas", "Propane", "Other"]),
        "specific_gravity": round(rng.uniform(0.2, 3.0), 2),
        "high_altitude": rng.random() < 0.3,
        "atmospheric_pressure": round(rng.uniform(8.8, 14.73), 2),
    }


def py_run(reference, case: dict) -> dict:
    """Run the reference, tagging algorithm faults the same way the JS does."""
    try:
        result = reference.run(case)
    except Exception as exc:  # the reference must never blow up either
        return {"ok": False, "errors": ["__PYTHON_EXCEPTION__ " + type(exc).__name__ + ": " + str(exc)]}
    if reference.LAST_ALGORITHM_ERROR is not None:
        result["__algorithm_error"] = reference.LAST_ALGORITHM_ERROR
    return result


def canon(obj) -> str:
    return json.dumps(obj, sort_keys=True, default=str)


def check_tool(tool_dir: Path, cases_per_seed: int, seeds: int) -> int:
    cfg = json.loads((tool_dir / "tool.json").read_text(encoding="utf-8"))
    slug = cfg["slug"]
    bundle = ROOT / "dist" / cfg["output"]
    if not bundle.exists():
        sys.exit(f"{bundle.relative_to(ROOT)} missing - run python3 build/build.py {slug} first")

    reference = load_reference(tool_dir)
    scenarios = json.loads((tool_dir / "scenarios.json").read_text(encoding="utf-8"))
    edge_cases = [s["input"] for s in scenarios["edge_cases"]]

    print(f"\n=== {slug} ===")
    total = 0
    mismatches = 0

    for seed in range(1, seeds + 1):
        rng = random.Random(seed)
        cases = list(edge_cases) + [random_case(rng) for _ in range(cases_per_seed)]

        proc = subprocess.run(
            ["node", str(ROOT / "build" / "run_js.js"), str(bundle), cfg["method"]],
            input=json.dumps(cases), capture_output=True, text=True,
        )
        if proc.returncode != 0:
            sys.stderr.write(proc.stderr[:4000] + "\n")
            sys.exit("JavaScript harness failed")
        js_results = json.loads(proc.stdout)

        for case, js in zip(cases, js_results):
            py = py_run(reference, case)
            total += 1
            if canon(py) != canon(js):
                mismatches += 1
                if mismatches <= 5:
                    print("\nMISMATCH on input:")
                    print("  " + canon(case))
                    print("  python: " + canon(py)[:600])
                    print("  js    : " + canon(js)[:600])

        print(f"seed {seed}: {total} cases checked, {mismatches} mismatches")

    if mismatches:
        print(f"\n{slug}: {mismatches} of {total} cases differ. dist/ must not be published.")
    else:
        print(f"{slug}: {total} cases, JavaScript output identical to Python.")
    return mismatches


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slugs", nargs="*", help="tool slugs (default: all)")
    ap.add_argument("--cases", type=int, default=4000, help="random cases per seed")
    ap.add_argument("--seeds", type=int, default=3)
    args = ap.parse_args()

    failures = 0
    for tool_dir in discover(args.slugs):
        failures += check_tool(tool_dir, args.cases, args.seeds)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
