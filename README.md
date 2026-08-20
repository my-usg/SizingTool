# USG Sizing Tool

The regulator sizing algorithm for Holland Supply Company, maintained in Python
and published as JavaScript that runs in the visitor's browser.

**To change how sizing works, edit `algorithm/all_models.py` and push.**
Everything else is automatic.

```
algorithm/all_models.py     the Python you edit  (source of truth)
        │
        │  tools/build.py          transpile
        ▼
dist/usg-all-models.js      generated - never edit by hand
        │
        │  tools/difftest.py       prove it matches the Python
        ▼
   published via jsDelivr  ──────►  web/sizing-tool-block.html
                                    (the Concrete CMS block on your site)
```

There is no server to run or pay for. The page downloads the algorithm once
(about 100 KB gzipped) and sizes instantly thereafter, offline included.

Setup instructions: see **[DEPLOYING.md](DEPLOYING.md)**.

## How a change reaches the website

1. Edit `algorithm/all_models.py`.
2. Commit and push to `main`.
3. GitHub Actions rebuilds `dist/`, proves the JavaScript matches the Python on
   ~10,000 inputs, tests the block, and commits the new bundle.
4. The website picks it up. jsDelivr caches a branch URL for up to 12 hours;
   see [Publishing and caching](#publishing-and-caching) to make it immediate.

If the verification fails, nothing is published and the site keeps running the
last good version.

## Layout

| Path | What it is |
| --- | --- |
| `algorithm/all_models.py` | **The algorithm.** Your original script with the CLI input/print section removed; the functions and capacity tables are byte-for-byte the original. |
| `src/wrapper.js` | Hand-written. Unit conversion, validation and result formatting - what the Streamlit front end used to do. |
| `tools/sizing_reference.py` | The Python twin of `wrapper.js`, so the tests can compare the whole pipeline, not just the algorithm. |
| `tools/transpile.py` | Python-to-JavaScript translator. |
| `tools/build.py` | Runs the translator and assembles `dist/`. |
| `tools/difftest.py` | Runs Python and JavaScript side by side and compares every field. |
| `dist/usg-all-models.js` | Generated bundle the website loads. Never edit. |
| `web/sizing-tool-block.html` | The block to paste into Concrete CMS. |
| `tests/browser_test.js` | Drives the real block in a headless browser. |

## Working locally

```bash
python3 tools/build.py                       # rebuild dist/
python3 tools/difftest.py --cases 2500 --seeds 4   # prove JS == Python
npm install jsdom --no-save
python3 tests/make_fixtures.py               # refresh expected page output
node tests/browser_test.js                   # test the block itself
```

To try the block in a browser, open `web/sizing-tool-block.html` and change the
`<script src>` near the top to `dist/usg-all-models.js`.

## Publishing and caching

The block loads the algorithm with:

```html
<script src="https://cdn.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-all-models.js"></script>
```

**The repository must be public** - jsDelivr cannot read a private repo, and
neither can a visitor's browser.

Two ways to publish, pick one:

* **Track `main` (default).** Pushes reach the site automatically within
  jsDelivr's cache window (up to 12 hours). To make an update immediate, visit
  `https://purge.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-all-models.js` once.
* **Pin a release tag.** Tag a release (`git tag v1.1.0 && git push --tags`) and
  use `@v1.1.0` in the block. Nothing changes on the site until you edit the
  block, which is stricter change control at the cost of a manual step. Tagged
  URLs are cached permanently and never need purging.

### Site configuration

The site's Content Security Policy must allow the CDN:

```
script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
```

`cdnjs.cloudflare.com` is for jsPDF, used by the Download PDF Summary button.
The `frame-src https://*.streamlit.app` entry added for the old embed is no
longer needed.

## Confidence: how we know the JavaScript is right

`tools/difftest.py` runs the same inputs through both the Python and the exact
JavaScript file the website loads, and compares the **entire** result: every
selection field, capacity, part number, warning, adjustment, input summary line
and error message. Any difference fails the build.

That is not a formality. It has already caught three real bugs during
development:

* Python `list + list` concatenates lists; the naive JavaScript translation
  produced string concatenation. Wrong part numbers in one branch.
* `'N/A'['color']` raises `TypeError` in Python but silently returns
  `undefined` in JavaScript, which produced a corrupted part number
  (`R.441-57S...None.I`) where Python correctly refused to size.
* `format(9.05, '.1f')` is `9.1` in Python; a scaled-rounding implementation
  gave `9.0`.

Each was invisible by inspection and only surfaced through differential
testing. Keep it in the pipeline.

### If you add new Python

The translator understands the subset the algorithm currently uses:

* `if` / `elif` / `else`, `for ... in`, function definitions, assignment,
  augmented assignment, comparisons, arithmetic, f-strings, list and dict
  literals, single-generator comprehensions
* builtins `abs`, `all`, `any`, `float`, `int`, `isinstance`, `len`, `list`,
  `max`, `min`, `round`, `sorted`, `str`, `globals`
* methods `.append`, `.get`, `.items`, `.join`, `.keys`, `.lower`, `.strip`,
  `.startswith`, `.endswith`, `.upper`, `.values`

Anything else - `try`/`except`, `while`, classes, `import`, generators, sets -
stops the build with the offending line number:

```
Unsupported stmt Try at line 2
```

You then either rewrite that line within the supported subset, or extend
`tools/transpile.py`. This is the main long-term cost of this approach: the
translator is a tool your team now owns.

## Known algorithm defect

Carried over from the original script, and present in the old Streamlit tool
too: **monitor sizing with an outlet pressure between 85 and 100 psi fails.**

`run_regulator_selection461()` sets a monitor setpoint of `outlet_input + 15`.
Above 85 psi outlet that exceeds 100 psi, past the top of the 57S spring table,
so `spring_57S()` returns the string `'N/A'` and the next line does
`'N/A'['color']`:

```python
mon_color = spring_57S(monset)['color']   # algorithm/all_models.py:3860
```

Reproduce: inlet 180 psi, outlet 90 psi, flow 800,000 CFH, monitor protection.

The algorithm is left untouched. The page catches the fault and shows a message
asking the customer to contact Holland Supply Company, rather than a broken
result. To fix it properly, decide what a monitor spring above 100 psi should
be - most likely `spring_X57`, which covers 75-250 psi - and handle the `'N/A'`
return. The tests will confirm nothing else moved.

## Changing the algorithm: what else needs touching

| Change | What else |
| --- | --- |
| Capacity numbers, thresholds, spring ranges, selection order, part-number format, bug fixes | Nothing. Push and it ships. |
| A new **output** field (a new key in the `match` dict) | Add one line to the field list in `src/wrapper.js` and `tools/sizing_reference.py` so it is displayed. |
| A new **input** the user supplies | A form control in `web/sizing-tool-block.html`, a line in its `buildInput()`, and the field in `wrapper.js` + `sizing_reference.py`. |
| Renaming the injected globals, `allmodels_selector()`'s signature or return, or `match` dict keys | Update `src/wrapper.js`, `tools/sizing_reference.py` and `tools/build.py`'s `$setGlobals`. |

Intended behaviour changes will fail `tests/fixtures.json`. That is the point:
read the diff, confirm the new numbers are what you wanted, run
`python3 tests/make_fixtures.py`, and commit the updated fixtures alongside your
change.
