#!/usr/bin/env python3
"""Generate tests/fixtures.json from the Python reference.

The browser test then checks that the rendered page shows exactly these
values. Regenerating is deliberate: if a fixture changes, someone has to look
at the diff and confirm the new numbers are intended.

    python3 tests/make_fixtures.py
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

logging.getLogger("usg-sizing").setLevel(logging.CRITICAL)
import sizing_reference  # noqa: E402

SCENARIOS = [
    ("basic in-wc sizing", {"inlet": 10, "outlet": 7, "outlet_units": "in wc", "flow": 500}),
    ("monitor + high efficiency + override", {
        "inlet": 19, "outlet": 1, "flow": 12321, "opp_required": True, "opp_pref": "Monitor",
        "high_efficiency": True, "high_efficiency_pct": 50,
        "override_oversize": True, "oversize_pct": 35}),
    ("IRV protection", {
        "inlet": 25, "outlet": 7, "outlet_units": "in wc", "flow": 300,
        "opp_required": True, "opp_pref": "IRV", "irv_pressure": 2.0}),
    ("partial IRV", {"inlet": 8, "outlet": 6.5, "outlet_units": "in wc", "flow": 350,
                     "partial_irv": True}),
    ("bar units", {"inlet": 2, "outlet": 0.05, "inlet_units": "bar", "outlet_units": "bar",
                   "flow": 3000}),
    ("kPa units", {"inlet": 350, "outlet": 60, "inlet_units": "kPa", "outlet_units": "kPa",
                   "flow": 1500}),
    ("oz outlet + CMH flow", {"inlet": 4, "outlet": 28, "outlet_units": "oz", "flow": 100,
                              "flow_units": "CMH"}),
    ("BTUH natural gas", {"inlet": 1.5, "outlet": 11, "outlet_units": "in wc",
                          "flow": 2500000, "flow_units": "BTUH"}),
    ("BTUH propane", {"inlet": 25, "outlet": 1, "flow": 1200000, "flow_units": "BTUH",
                      "gas_type": "Propane"}),
    ("other gas", {"inlet": 5, "outlet": 2, "flow": 5000, "gas_type": "Other",
                   "specific_gravity": 1.2}),
    ("high altitude", {"inlet": 10, "outlet": 1, "flow": 800, "high_altitude": True,
                       "atmospheric_pressure": 12.0}),
    ("combustion preference (121 pipe note)", {
        "inlet": 100, "outlet": 30, "flow": 50000, "opp_required": True,
        "opp_pref": "Monitor", "prefer_combustion": True}),
    ("requested pipe size", {"inlet": 2, "outlet": 8, "outlet_units": "in wc", "flow": 900,
                             "pipe_size": '3/4"'}),
    ("large monitor selection", {"inlet": 750, "outlet": 100, "flow": 400000,
                                 "opp_required": True, "opp_pref": "Monitor"}),
    ("nothing entered", {}),
    ("outlet above inlet", {"inlet": 10, "outlet": 20, "flow": 500}),
    ("MAIP below inlet", {"inlet": 10, "outlet": 2, "flow": 500, "maop": 5}),
    ("two pressure cuts", {"inlet": 200, "outlet": 2, "flow": 500}),
    ("BTUH with other gas", {"inlet": 10, "outlet": 2, "flow": 500000, "flow_units": "BTUH",
                             "gas_type": "Other", "specific_gravity": 0.9}),
    ("no regulator fits", {"inlet": 999, "outlet": 250, "flow": 10000000}),
    ("known algorithm defect", {"inlet": 180, "outlet": 90, "flow": 800000,
                                "opp_required": True, "opp_pref": "Monitor"}),
]


def main() -> None:
    fixtures = []
    for name, payload in SCENARIOS:
        fixtures.append({"name": name, "input": payload, "expected": sizing_reference.run(payload)})
    out = Path(__file__).parent / "fixtures.json"
    out.write_text(json.dumps(fixtures, indent=1) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({len(fixtures)} scenarios)")


if __name__ == "__main__":
    main()
