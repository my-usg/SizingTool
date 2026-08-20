# Tests

| File | Purpose |
| --- | --- |
| `../tools/difftest.py` | Runs Python and the shipped JavaScript over the same inputs and compares every field of the result. This is the guard that makes the transpiled build trustworthy. |
| `browser_test.js` | Loads the real block and the real bundle in a headless browser and checks the page shows exactly what Python computes. |
| `make_fixtures.py` | Regenerates `fixtures.json` from the Python reference. Run it when you intend to change results, and commit the diff. |
