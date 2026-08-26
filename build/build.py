#!/usr/bin/env python3
"""Build a tool's JavaScript bundle from its Python algorithm.

    python3 build/build.py                # build every tool
    python3 build/build.py all-models     # build one tool

For each tool it reads tools/<slug>/tool.json, transpiles
tools/<slug>/algorithm.py to JavaScript, and writes dist/<output>.

The build is REPRODUCIBLE: identical sources produce a byte-identical bundle.
No timestamp is embedded, so dist/ only changes when the sources actually
change - which keeps CI from republishing every bundle on every push and
keeps visitors from re-downloading unchanged files.
"""

from __future__ import annotations

import ast
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS_DIR = ROOT / "tools"
DIST = ROOT / "dist"
VERSION_FILE = ROOT / "VERSION"


def discover(slugs: list[str] | None) -> list[Path]:
    if slugs:
        dirs = []
        for slug in slugs:
            d = TOOLS_DIR / slug
            if not (d / "tool.json").exists():
                sys.exit(f"no such tool: {slug} (expected {d / 'tool.json'})")
            dirs.append(d)
        return dirs
    found = sorted(p.parent for p in TOOLS_DIR.glob("*/tool.json"))
    if not found:
        sys.exit(f"no tools found under {TOOLS_DIR}")
    return found


def transpile(tool_dir: Path, cfg: dict) -> str:
    algorithm = tool_dir / "algorithm.py"
    result = subprocess.run(
        [
            sys.executable,
            str(ROOT / "build" / "transpile.py"),
            str(algorithm),
            ",".join(cfg["injected_globals"]),
            ",".join(cfg.get("skip_functions", [])),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        message = (result.stdout + result.stderr).strip()
        sys.stderr.write(
            f"\nTranspile failed for '{cfg['slug']}'.\n\n  {message}\n\n"
            "The algorithm uses Python the transpiler does not support yet.\n"
            "Either rewrite that line using the supported subset (see README),\n"
            "or extend build/transpile.py.\n"
        )
        sys.exit(1)
    return result.stdout


def build_one(tool_dir: Path) -> Path:
    cfg = json.loads((tool_dir / "tool.json").read_text(encoding="utf-8"))
    slug = cfg["slug"]
    algorithm = tool_dir / "algorithm.py"
    wrapper_path = tool_dir / "wrapper.js"

    try:
        ast.parse(algorithm.read_text(encoding="utf-8"))
    except SyntaxError as exc:
        sys.exit(f"{algorithm.relative_to(ROOT)} is not valid Python: {exc}")

    core = transpile(tool_dir, cfg)
    wrapper = wrapper_path.read_text(encoding="utf-8")
    version = VERSION_FILE.read_text(encoding="utf-8").strip() if VERSION_FILE.exists() else "0.0.0"

    algo_hash = hashlib.sha256(algorithm.read_bytes()).hexdigest()[:12]
    sources_hash = hashlib.sha256(
        algorithm.read_bytes() + wrapper_path.read_bytes() + version.encode()
    ).hexdigest()[:12]

    # Assign the algorithm's module-level globals for one calculation. Generated
    # from tool.json so a new tool never needs this written by hand.
    set_globals = "\n".join(
        f"    {name} = values.{name};" for name in cfg["injected_globals"]
    )
    # Some algorithms read a global back after the entry call (the 143 builds its
    # capacity tables from result143, exactly as the Streamlit app did), so a
    # single-global setter is generated too.
    set_one = "\n".join(
        f"      case '{name}': {name} = value; return;" for name in cfg["injected_globals"]
    )

    header = f"""/*!
 * {cfg['title']}
 * Holland Supply Company
 *
 * GENERATED FILE - DO NOT EDIT.
 * Built from tools/{slug}/algorithm.py by build/build.py.
 * Edit the Python, push, and CI regenerates this file.
 *
 * tool:      {slug}
 * version:   {version}
 * algorithm: sha256:{algo_hash}
 * sources:   sha256:{sources_hash}
 *
 * Adds to the shared namespace:
 *   USGSizing.{cfg['method']}(input)  -> result object
 *   USGSizing.versions['{slug}']      -> build metadata
 */
"""

    body = f"""(function (root) {{
  'use strict';

{core}

{wrapper}

  function $setGlobals(values) {{
{set_globals}
  }}

  function $setGlobal(name, value) {{
    switch (name) {{
{set_one}
    }}
    throw new Error('not an injected global: ' + name);
  }}

  // Join the shared namespace rather than replacing it, so several tools can
  // coexist on one page without clobbering each other.
  var ns = root.USGSizing = root.USGSizing || {{}};
  ns.{cfg['method']} = sizeTool;
  ns.options = ns.options || {{}};
  ns.options['{slug}'] = {{
    inlet_units: INLET_UNITS,
    outlet_units: OUTLET_UNITS,
    flow_units: FLOW_UNITS,
    pipe_sizes: PIPE_OPTIONS,
    gas_types: GAS_TYPES
  }};
  ns.versions = ns.versions || {{}};
  ns.versions['{slug}'] = {{
    version: '{version}',
    algorithm: 'sha256:{algo_hash}',
    sources: 'sha256:{sources_hash}'
  }};
}})(typeof window !== 'undefined' ? window : this);
"""

    DIST.mkdir(parents=True, exist_ok=True)
    out = DIST / cfg["output"]
    out.write_text(header + body, encoding="utf-8")
    print(
        f"built {out.relative_to(ROOT)}  "
        f"({out.stat().st_size / 1024:.0f} KB, {slug}, version {version}, "
        f"algorithm sha256:{algo_hash})"
    )
    return out


def main() -> None:
    slugs = sys.argv[1:]
    for tool_dir in discover(slugs or None):
        build_one(tool_dir)


if __name__ == "__main__":
    main()
