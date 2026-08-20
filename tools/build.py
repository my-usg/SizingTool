#!/usr/bin/env python3
"""Build dist/usg-all-models.js from the Python algorithm.

    python3 tools/build.py

Steps:
  1. Transpile algorithm/all_models.py to JavaScript.
  2. Concatenate: runtime helpers + transpiled algorithm + hand-written wrapper.
  3. Wrap in an IIFE that exposes exactly one global, window.USGSizing.

The output is committed to dist/ so that jsDelivr can serve it straight from
GitHub. Never edit dist/ by hand - CI overwrites it.
"""

from __future__ import annotations

import ast
import hashlib
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALGORITHM = ROOT / "algorithm" / "all_models.py"
WRAPPER = ROOT / "src" / "wrapper.js"
OUT = ROOT / "dist" / "usg-all-models.js"
VERSION_FILE = ROOT / "VERSION"

# The globals the algorithm expects the caller to supply.
INJECTED = [
    "inlet_input", "outlet_input", "flow_rate", "min_flow", "maop",
    "pipesize_input", "opp_type", "irv_input", "oversizeby", "gastypemult",
    "pload", "combust_pref", "Patm",
]
# CLI-only helpers that reference names the web build never sets.
SKIP = ["print_regulator_selection"]


def transpile() -> str:
    result = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "transpile.py"), str(ALGORITHM),
         ",".join(INJECTED), ",".join(SKIP)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(
            "\nTranspile failed. The algorithm uses Python the transpiler does "
            "not support yet:\n\n  " + result.stdout.strip() + result.stderr.strip() + "\n\n"
            "Either rewrite that line using the supported subset (if/for/"
            "assignment, and the builtins listed in the README), or extend "
            "tools/transpile.py.\n"
        )
        sys.exit(1)
    return result.stdout


def main() -> None:
    # Fail fast if the algorithm is not even valid Python.
    try:
        ast.parse(ALGORITHM.read_text(encoding="utf-8"))
    except SyntaxError as exc:
        sys.exit(f"algorithm/all_models.py is not valid Python: {exc}")

    core = transpile()
    wrapper = WRAPPER.read_text(encoding="utf-8")
    version = VERSION_FILE.read_text(encoding="utf-8").strip() if VERSION_FILE.exists() else "0.0.0"
    algo_hash = hashlib.sha256(ALGORITHM.read_bytes()).hexdigest()[:12]
    built = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    header = f"""/*!
 * USG General Sizing Tool - All Models
 * Holland Supply Company
 *
 * GENERATED FILE - DO NOT EDIT.
 * Built from algorithm/all_models.py by tools/build.py.
 * Edit the Python, push, and CI regenerates this file.
 *
 * version:   {version}
 * algorithm: sha256:{algo_hash}
 * built:     {built}
 *
 * Exposes one global:
 *   USGSizing.sizeAllModels(input)  -> result object
 *   USGSizing.version               -> build metadata
 */
"""

    body = f"""(function (root) {{
  'use strict';

{core}

{wrapper}

  // Assign the algorithm's module-level globals for one calculation. The
  // transpiled script reads these by name, exactly as the Python does.
  function $setGlobals(values) {{
    inlet_input = values.inlet_input;
    outlet_input = values.outlet_input;
    flow_rate = values.flow_rate;
    min_flow = values.min_flow;
    maop = values.maop;
    pipesize_input = values.pipesize_input;
    opp_type = values.opp_type;
    irv_input = values.irv_input;
    oversizeby = values.oversizeby;
    gastypemult = values.gastypemult;
    pload = values.pload;
    combust_pref = values.combust_pref;
    Patm = values.Patm;
  }}

  root.USGSizing = {{
    sizeAllModels: sizeAllModels,
    options: {{
      inlet_units: INLET_UNITS,
      outlet_units: OUTLET_UNITS,
      flow_units: FLOW_UNITS,
      pipe_sizes: PIPE_OPTIONS,
      gas_types: GAS_TYPES
    }},
    version: {{
      version: '{version}',
      algorithm: 'sha256:{algo_hash}',
      built: '{built}'
    }}
  }};
}})(typeof window !== 'undefined' ? window : this);
"""

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(header + body, encoding="utf-8")

    size_kb = OUT.stat().st_size / 1024
    print(f"built {OUT.relative_to(ROOT)}  ({size_kb:.0f} KB, version {version}, algorithm sha256:{algo_hash})")


if __name__ == "__main__":
    main()
