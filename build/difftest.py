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

def random_case(rng: random.Random, spec: dict) -> dict:
    """Generate one input from the tool's "random" spec in scenarios.json.

    Keeping the spec with the tool (rather than in this file) means each tool
    fuzzes only inputs its own form can actually produce - no 3/8" pipe on a
    tool whose smallest body is 3/4".

    Field kinds:
      {"choices": [...]}                          pick one
      {"int": [lo, hi]}                           random integer
      {"bool": 0.4}                               true with that probability
      {"float": [lo, hi], "decimals": [0, 1, 2]}  random float, rounded
      {"float_by": {"key": "inlet_units",         range depends on another
                    "ranges": {"psi": [..], ...}},   field already generated
       "decimals": [1, 2]}
    """
    case = {}
    for name, rule in spec.items():
        if "choices" in rule:
            case[name] = rng.choice(rule["choices"])
        elif "int" in rule:
            lo, hi = rule["int"]
            case[name] = rng.randint(lo, hi)
        elif "bool" in rule:
            case[name] = rng.random() < rule["bool"]
        elif "float" in rule or "float_by" in rule:
            if "float_by" in rule:
                key = rule["float_by"]["key"]
                lo, hi = rule["float_by"]["ranges"][case[key]]
            else:
                lo, hi = rule["float"]
            case[name] = round(rng.uniform(lo, hi), rng.choice(rule.get("decimals", [2])))
        else:
            raise SystemExit(f"unknown random rule for {name}: {rule}")
    return case


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
    random_spec = scenarios.get("random", {})

    print(f"\n=== {slug} ===")
    total = 0
    mismatches = 0

    for seed in range(1, seeds + 1):
        rng = random.Random(seed)
        cases = list(edge_cases) + [random_case(rng, random_spec) for _ in range(cases_per_seed)]

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
