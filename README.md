# USG Sizing Tools

Regulator sizing tools for Holland Supply Company. Each tool's algorithm is
maintained in **Python** and published as JavaScript that runs in the visitor's
browser.

**To change how a tool sizes, edit `tools/<tool>/algorithm.py` and push.**
Everything else is automatic.

Setup instructions: **[DEPLOYING.md](DEPLOYING.md)**.

## Tools

| Tool | Algorithm | Bundle | Website page |
| --- | --- | --- | --- |
| all-models | `tools/all-models/algorithm.py` | `dist/usg-all-models.js` | `/resources/regulator-sizing-tools/general` |
| model-143 | `tools/model-143/algorithm.py` | `dist/usg-model-143.js` | `/resources/regulator-sizing-tools/model-143` |
| model-046 | `tools/model-046/algorithm.py` | `dist/usg-model-046.js` | `/resources/regulator-sizing-tools/model-046` |

The 143 and 046 additionally render capacity tables, colour-coded Yes/No and
horizontally scrollable on a phone. The 143 shows three (one per body size); the
046 groups its tables into labelled sections and shows **both** the IRV and
Monitor families when sizing for IRV. Every cell is compared against Python in
the tests, like everything else.

## How it fits together

```
tools/all-models/algorithm.py      the Python you edit  (source of truth)
        │
        │  build/build.py                 transpile to JavaScript
        ▼
dist/usg-all-models.js             generated - never edit by hand
        │
        │  build/difftest.py              prove it matches the Python
        ▼
   published via jsDelivr  ──────►  tools/all-models/block.html
                                    (pasted into the Concrete CMS page)
```

There is no server to run or pay for. Each page downloads its own algorithm
once (about 50 KB gzipped) and sizes instantly thereafter.

## Repository layout

```
build/                     shared machinery - used by every tool
├─ transpile.py              Python to JavaScript translator
├─ build.py                  builds one tool or all
├─ difftest.py               proves the JavaScript matches the Python
├─ run_js.js                 runs a bundle over a batch of inputs
├─ make_fixtures.py          regenerates expected results
└─ browser_test.js           drives a block in a headless browser

tools/<tool>/              one folder per sizing tool
├─ tool.json                 entry function, injected globals, output name
├─ algorithm.py            THE PYTHON YOU EDIT
├─ wrapper.js                units, validation, result shaping
├─ reference.py              Python twin of wrapper.js, for the tests
├─ scenarios.json            test inputs (edge cases, fixtures, fuzz ranges)
├─ fixtures.json             expected page output - generated, but committed
├─ block.html                the Concrete CMS block for this page
└─ form-map.js               how the browser test drives this form

dist/                      built bundles, one per tool - never edit
```

Shared machinery lives in `build/` so a fix benefits every tool at once. When
that machinery changes, CI re-verifies **all** tools before anything is
published - which matters, because a translator bug would otherwise affect
every tool silently.

## Working locally

```bash
python3 build/build.py                          # build all tools
python3 build/build.py all-models               # build one
python3 build/difftest.py --cases 2500 --seeds 4 # prove JS == Python
npm install jsdom --no-save
python3 build/make_fixtures.py                  # refresh expected output
node build/browser_test.js                      # test the blocks
```

Each command takes an optional tool slug to work on just that tool.

To try a block in a browser, open `tools/<tool>/block.html` and point the
`<script src>` near the top at the local `dist/` file.

## Publishing and caching

A block loads its algorithm with:

```html
<script src="https://cdn.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-all-models.js"></script>
```

**The repository must be public** - jsDelivr cannot read a private repo, and
neither can a visitor's browser.

Two ways to publish, pick one:

* **Track `main` (default).** Pushes reach the site automatically within
  jsDelivr's cache window (up to 12 hours). To make an update immediate, load
  `https://purge.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-all-models.js`
  once.
* **Pin a release tag.** Tag a release (`git tag v1.1.0 && git push --tags`) and
  use `@v1.1.0` in the block. Nothing changes on the site until you edit the
  block - stricter control, at the cost of a manual step. Tagged URLs are cached
  permanently and never need purging.

The build is **reproducible**: identical sources produce a byte-identical
bundle. Nothing is republished unless it actually changed, so an unrelated push
never invalidates a visitor's cache.

### Site configuration

The Content Security Policy must allow both CDNs:

```
script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
```

`cdn.jsdelivr.net` serves the algorithms; `cdnjs.cloudflare.com` serves jsPDF
for the Download PDF Summary button.

Bundles join a shared `window.USGSizing` namespace rather than replacing it
(`USGSizing.sizeAllModels`, `USGSizing.sizeModel143`, ...), so several tools can
coexist on one page.

## Confidence: how we know the JavaScript is right

`build/difftest.py` runs the same inputs through the Python and through the
exact JavaScript file the website loads, comparing the **entire** result: every
selection field, capacity, part number, warning, adjustment, summary line and
error message. Any difference fails the build.

That is not a formality. It caught four real bugs during development:

* Python `list + list` concatenates lists; the naive JavaScript translation
  produced string concatenation - wrong part numbers in one branch.
* `'N/A'['color']` raises `TypeError` in Python but silently returns
  `undefined` in JavaScript, producing a corrupted part number
  (`R.441-57S...None.I`) where Python correctly refused to size.
* `format(9.05, '.1f')` is `9.1` in Python; a scaled-rounding implementation
  gave `9.0`.
* A stray line in `wrapper.js` reported converted psi values instead of the
  pressures the user typed.

Each was invisible by inspection. Keep this in the pipeline.

### If you add new Python

The translator understands the subset the algorithms currently use:

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

Rewrite that line within the supported subset, or extend
`build/transpile.py`. This is the main long-term cost of this approach: the
translator is a tool your team owns.

## Adding a tool

1. `mkdir tools/<slug>` and add the eight files listed above. Copy
   `tools/all-models/` as a starting point.
2. Put the Python (CLI input/print section removed) in `algorithm.py`.
3. Fill in `tool.json`: the entry function name, the globals the algorithm
   expects the caller to set, the output filename, and the namespace method.
   Add a `"random"` block to `scenarios.json` describing the ranges the fuzz
   test should use, so it only generates inputs the form can produce.
4. Adapt `wrapper.js` and `reference.py` to that tool's inputs, validation and
   outputs - keeping them equivalent, since the tests compare them.
5. Adapt `block.html` for the tool's form, pointing its `<script src>` at the
   new bundle.
6. Add the slug to the `matrix.tool` list in `.github/workflows/build.yml`.
7. Run the four local commands above, commit, push.

## Known algorithm defects

Both are carried over from the original scripts and present in the old
Streamlit tools too. Neither algorithm has been modified; in each case the page
catches the fault and asks the customer to contact Holland Supply Company
rather than showing a broken result.

### all-models: monitor sizing, 85-100 psi outlet

`run_regulator_selection461()` sets a monitor setpoint of `outlet_input + 15`.
Above 85 psi outlet that exceeds 100 psi, past the top of the 57S spring table,
so `spring_57S()` returns the string `'N/A'` and the next line does
`'N/A'['color']`.

Reproduce: inlet 180 psi, outlet 90 psi, flow 800,000 CFH, monitor protection.

To fix it, decide what a monitor spring above 100 psi should be - most likely
`spring_X57`, which covers 75-250 psi - and handle the `'N/A'` return.

### model-046: IRV tables at high outlet pressure

`will_irv_work046()` looks up the selected spring in its IRV table:

```python
irv_table = spring_map[spring]          # tools/model-046/algorithm.py:477
```

`spring_046()` returns `Gray` for high outlet pressures, but `spring_map` has no
`Gray` entry, so building the IRV capacity tables raises `KeyError: 'Gray'`.

Reproduce: inlet 520 psi, outlet 164 psi, flow 388,553 CFH, IRV protection.

To fix it, add the `Gray` spring to `spring_map` (or decide that IRV is not
offered on that spring and return `"No"`). The tests will confirm nothing else
moved.

## Changing an algorithm: what else needs touching

| Change | What else |
| --- | --- |
| Capacity numbers, thresholds, spring ranges, selection order, part-number format, bug fixes | Nothing. Push and it ships. |
| A new **output** field (a new key in the `match` dict) | One line in that tool's `wrapper.js` and `reference.py` so it is displayed. |
| A new **input** the user supplies | A control in `block.html`, a line in its `buildInput()`, and the field in `wrapper.js` + `reference.py`. |
| Renaming the injected globals, the entry function's signature or return, or `match` dict keys | Update `wrapper.js`, `reference.py` and `tool.json`. |

Intended behaviour changes will fail the fixtures check. That is the point: read
the diff, confirm the new numbers are what you wanted, run
`python3 build/make_fixtures.py <tool>`, and commit the updated `fixtures.json`
alongside your change.
