#!/usr/bin/env python3
"""Regenerate tools/<slug>/fixtures.json from the tool's Python reference.

    python3 build/make_fixtures.py                # every tool
    python3 build/make_fixtures.py all-models     # one tool

fixtures.json records exactly what each named scenario in scenarios.json should
produce. The browser test then asserts the rendered page shows those values.

Regenerating is deliberate. If a fixture changes, someone has to look at the
diff and confirm the new numbers are intended - that is the check that stops an
accidental algorithm edit from silently changing what customers are told.
"""

from __future__ import annotations

import importlib.util
import json
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
logging.getLogger("usg-sizing").setLevel(logging.CRITICAL)


def load_reference(tool_dir: Path):
    spec = importlib.util.spec_from_file_location(
        f"reference_{tool_dir.name.replace('-', '_')}", tool_dir / "reference.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def discover(slugs: list[str]) -> list[Path]:
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


def main() -> None:
    for tool_dir in discover(sys.argv[1:]):
        reference = load_reference(tool_dir)
        scenarios = json.loads((tool_dir / "scenarios.json").read_text(encoding="utf-8"))
        fixtures = [
            {"name": s["name"], "input": s["input"], "expected": reference.run(s["input"])}
            for s in scenarios["fixtures"]
        ]
        out = tool_dir / "fixtures.json"
        out.write_text(json.dumps(fixtures, indent=1) + "\n", encoding="utf-8")
        print(f"wrote {out.relative_to(ROOT)} ({len(fixtures)} scenarios)")


if __name__ == "__main__":
    main()
