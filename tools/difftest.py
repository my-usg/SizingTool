#!/usr/bin/env python3
"""Prove the shipped JavaScript matches the Python, end to end.

    python3 tools/difftest.py [--cases N] [--seeds N]

For each generated input this runs:

    Python:     tools/sizing_reference.py  ->  algorithm/all_models.py
    JavaScript: dist/usg-all-models.js     (the exact file the website loads)

and compares the ENTIRE result object - selection fields, capacity, part
numbers, warnings, adjustments, input summary and error messages. Any
difference fails the build, so a mistranslation cannot reach the website.

This covers the whole pipeline, not just the algorithm: unit conversion,
validation wording and ordering, number formatting and rounding are all
included, because those live in src/wrapper.js and can drift too.
"""

from __future__ import annotations

import argparse
import json
import random
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

import logging  # noqa: E402

# The known algorithm defect is caught and reported as a normal result; its
# traceback would otherwise flood the output.
logging.getLogger("usg-sizing").setLevel(logging.CRITICAL)

import sizing_reference  # noqa: E402

PIPE_OPTIONS = ["N/A", '3/8"', '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"']

# Fixed cases that must always be covered, whatever the random seed does.
EDGE_CASES = [
    {},                                                                   # nothing entered
    {"inlet": 10, "outlet": 7, "outlet_units": "in wc", "flow": 500},
    {"inlet": 19, "outlet": 1, "flow": 12321, "opp_required": True, "opp_pref": "Monitor",
     "high_efficiency": True, "high_efficiency_pct": 50,
     "override_oversize": True, "oversize_pct": 35},
    {"inlet": 25, "outlet": 7, "outlet_units": "in wc", "flow": 300,
     "opp_required": True, "opp_pref": "IRV", "irv_pressure": 2.0},
    {"inlet": 8, "outlet": 6.5, "outlet_units": "in wc", "flow": 350, "partial_irv": True},
    {"inlet": 2, "outlet": 0.05, "inlet_units": "bar", "outlet_units": "bar", "flow": 3000},
    {"inlet": 350, "outlet": 60, "inlet_units": "kPa", "outlet_units": "kPa", "flow": 1500},
    {"inlet": 4, "outlet": 28, "outlet_units": "oz", "flow": 100, "flow_units": "CMH"},
    {"inlet": 1.5, "outlet": 11, "outlet_units": "in wc", "flow": 2500000, "flow_units": "BTUH"},
    {"inlet": 25, "outlet": 1, "flow": 1200000, "flow_units": "BTUH", "gas_type": "Propane"},
    {"inlet": 10, "outlet": 2, "flow": 500000, "flow_units": "BTUH", "gas_type": "Other",
     "specific_gravity": 0.9},                                            # BTUH error path
    {"inlet": 5, "outlet": 2, "flow": 5000, "gas_type": "Other", "specific_gravity": 1.2},
    {"inlet": 10, "outlet": 1, "flow": 800, "high_altitude": True, "atmospheric_pressure": 12.0},
    {"inlet": 100, "outlet": 30, "flow": 50000, "opp_required": True, "opp_pref": "Monitor",
     "prefer_combustion": True},                                          # 121 pipe note
    {"inlet": 750, "outlet": 100, "flow": 400000, "opp_required": True, "opp_pref": "Monitor"},
    {"inlet": 999, "outlet": 250, "flow": 10000000},                      # no match
    {"inlet": 180, "outlet": 90, "flow": 800000, "opp_required": True,
     "opp_pref": "Monitor"},                                              # known defect
    {"inlet": 200, "outlet": 2, "flow": 500},                             # two pressure cuts
    {"inlet": 10, "outlet": 20, "flow": 500},                             # outlet >= inlet
    {"inlet": 10, "outlet": 2, "flow": 500, "maop": 5},                   # MAIP rule
    {"inlet": 10, "outlet": 2, "flow": 500, "min_flow": 900},             # min > max flow
    {"inlet": 0.2, "outlet": 0.1, "flow": 100},                           # below inlet range
]


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


def py_run(case: dict) -> dict:
    """Run the reference, tagging algorithm faults the same way the JS does."""
    try:
        result = sizing_reference.run(case)
    except Exception as exc:  # the reference must never blow up either
        return {"ok": False, "errors": ["__PYTHON_EXCEPTION__ " + type(exc).__name__ + ": " + str(exc)]}
    if sizing_reference.LAST_ALGORITHM_ERROR is not None:
        result["__algorithm_error"] = sizing_reference.LAST_ALGORITHM_ERROR
    return result


def canon(obj) -> str:
    return json.dumps(obj, sort_keys=True, default=str)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cases", type=int, default=4000, help="random cases per seed")
    ap.add_argument("--seeds", type=int, default=3)
    args = ap.parse_args()

    bundle = ROOT / "dist" / "usg-all-models.js"
    if not bundle.exists():
        sys.exit("dist/usg-all-models.js missing - run python3 tools/build.py first")

    total = 0
    mismatches = 0

    for seed in range(1, args.seeds + 1):
        rng = random.Random(seed)
        cases = list(EDGE_CASES) + [random_case(rng) for _ in range(args.cases)]

        proc = subprocess.run(
            ["node", str(ROOT / "tools" / "run_js.js"), str(bundle)],
            input=json.dumps(cases), capture_output=True, text=True,
        )
        if proc.returncode != 0:
            sys.stderr.write(proc.stderr[:4000] + "\n")
            sys.exit("JavaScript harness failed")
        js_results = json.loads(proc.stdout)

        for case, js in zip(cases, js_results):
            py = py_run(case)
            total += 1
            if canon(py) != canon(js):
                mismatches += 1
                if mismatches <= 5:
                    print("\nMISMATCH on input:")
                    print("  " + canon(case))
                    print("  python: " + canon(py)[:600])
                    print("  js    : " + canon(js)[:600])

        print(f"seed {seed}: {total} cases checked, {mismatches} mismatches")

    print(f"\nTOTAL {total} cases, {mismatches} mismatches")
    if mismatches:
        print("\nThe JavaScript does not match the Python. dist/ must not be published.")
        return 1
    print("JavaScript output is identical to Python on every case.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
