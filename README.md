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
| model-243 | `tools/model-243/algorithm.py` | `dist/usg-model-243.js` | `/resources/regulator-sizing-tools/model-243` |
| model-496 | `tools/model-496/algorithm.py` | `dist/usg-model-496.js` | `/resources/regulator-sizing-tools/model-496` |
| model-121 | `tools/model-121/algorithm.py` | `dist/usg-model-121.js` | `/resources/regulator-sizing-tools/model-121-122` |
| model-rpc | `tools/model-rpc/algorithm.py` | `dist/usg-model-rpc.js` | `/resources/regulator-sizing-tools/model-243-rpc` |
| model-461 | `tools/model-461/algorithm.py` | `dist/usg-model-461.js` | `/resources/regulator-sizing-tools/model-441-461` |

All eight tools are in place. The 441/461 differs most in shape: its entry point
takes the flows as arguments and returns three values, its two capacity tables
come from the algorithm's own `build_standard_table()` and
`build_vport_table()` rather than a shared result map, it has six table columns
including Qmax and Qmin, and it has no pipe-size input at all.

Every tool except all-models renders capacity tables, colour-coded Yes/No and
horizontally scrollable on a phone. The 143 shows three and the 496 four, one
per body size.
The 046 groups its tables into labelled sections, showing **both** the IRV and
Monitor families when sizing for IRV. The 243 is the most conditional: which
family it tabulates depends on the outlet pressure and protection type, across
standard and high-pressure datasets, and an IRV request at 2 psi or more outlet
is drawn as monitor tables. The 121/122 groups its tables into Standard and
V-Port sets, lists body sizes rather than orifices, drops registers with no
V-Port variant, and adds an outlet pipe sizing note to the selection. Every cell is compared against Python in the tests,
like everything else.

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
* `f"{x:,}"` keeps the decimal on a Python float (`5000.0` renders as
  `"5,000.0"`), which matters because the 121 computes its minimum flow after
  the float conversion while other tools keep it an integer.
* `$GLOBALS` was hardcoded with the all-models global names, so a tool that
  did not inject a given global still reported it present via
  `'name' in globals()` - and the algorithm then referenced an undefined
  variable. It is now generated per tool from `tool.json`.
* Computing the elevation reduction before validation made Python raise
  `ZeroDivisionError` when inlet equals outlet, where JavaScript produced
  `NaN`. Every tool had it; all now validate first, and the input is pinned as
  an edge case in all six.

Each was invisible by inspection. Keep this in the pipeline.

### If you add new Python

The translator understands the subset the algorithms currently use:

* `if` / `elif` / `else`, `for ... in`, function definitions, assignment,
  augmented assignment, comparisons, arithmetic, f-strings, list and dict
  literals, single-generator comprehensions
* builtins `abs`, `all`, `any`, `float`, `int`, `isinstance`, `len`, `list`,
  `max`, `min`, `round`, `sorted`, `str`, `globals`
* methods `.append`, `.get`, `.index`, `.items`, `.join`, `.keys`, `.lower`,
  `.strip`, `.startswith`, `.endswith`, `.upper`, `.values`

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

`build/fault_sweep.py` walks every tool's input ranges on a grid and reports
inputs the algorithm cannot answer (a spring colour missing from a lookup
table, an orifice outside its range). Run it after any algorithm change:

```bash
python3 build/fault_sweep.py            # all tools
python3 build/fault_sweep.py model-046  # one tool
```

Current state: **six of eight tools are clean.** One defect remains, in the two
tools that share the 57S spring functions, and it needs an engineering decision
rather than a code fix.

### all-models and model-461: monitor sizing, 85-100 psi outlet (OPEN)

Both tools share `spring_57S()` / `spring_X57()`, so both carry this. The
window is identical in each: **outlet above 85 psi and up to 100 psi with
monitor protection.**

`gen_match` sets a monitor setpoint of `outlet_input + 15` for outlets between
85 and 100 psi. That exceeds 100 psi, which is the top of the 57S spring table,
so `spring_57S()` returns the string `'N/A'` and the next line subscripts it:

```python
mon_color = spring_57S(monset)['color']   # tools/all-models/algorithm.py:3864
```

Reproduce in either tool: inlet 180 psi, outlet 90 psi, flow 800,000 CFH,
monitor protection.

The page catches this and asks the customer to contact Holland Supply Company,
which is safe but unhelpful. It is left open deliberately: the 57S series has
no spring above 100 psi, so answering it means deciding **what monitor spring a
57S regulator should use above 100 psi**, and that is a product question. The
options, in the order we would suggest considering them:

1. **Reject the candidate.** If a 57S cannot do monitor duty at that setpoint,
   it should not be selected; the selection loop would then fall through to the
   `461-X57` / `441-X57` models, whose spring table covers 75-250 psi. Safest,
   and probably what the selection logic intends.
2. **Borrow the X57 spring** (`spring_X57(monset)`, 75-250 psi) while keeping
   the 57S body. One line, but it asserts that spring fits that body - only USG
   can confirm that.
3. **Leave as is.** The affected window is narrow and the customer is directed
   to a human.

Whichever you choose, apply it to **both** `tools/all-models/algorithm.py` and
`tools/model-461/algorithm.py` - they carry separate copies of the same spring
functions. The input is pinned as an edge case in both, so the fault sweep and
the differential tests will confirm the fix lands in both places.

Do not simply return `None` for the monitor spring: the tool would then present
a monitor selection with no monitor spring named, which is worse than declining.

### model-rpc: spring table excluded its own top value (FIXED)

`spring_RPC()` tested `elif op < 35` for its highest spring and had no `else`,
so it returned `None` at 35 psi and above. The caller subscripts the result, so
this broke two things: plain sizing at exactly a 35 psi outlet (which the
validation explicitly permits) and **all** monitor sizing at 32 psi outlet or
above, because the monitor setpoint is capped at exactly 35.

Three pieces of evidence say 35 belongs inside that branch: the spring's own
range reads `"(10 - 35 psi)"`, the outlet validation allows up to 35, and the
setpoint cap is 35. Changed to `elif op <= 35`.

Pinned by the fixtures "outlet at exactly 35 psi (spring table top)" and
"monitor at 33 psi outlet (setpoint capped at 35)".

### model-046: Gray spring IRV lookup (FIXED)

`will_irv_work046()` looked the selected spring up in its IRV curve map with
`spring_map[spring]`. `spring_046()` returns `Gray` above 125 psi outlet and
`None` above 200 psi, neither of which is in that map, so the lookup raised
`KeyError` - and the tool reported "could not be sized automatically" for
**every** IRV request with an outlet above roughly 125 psi (568 inputs on the
sweep grid).

The fix is supported by the algorithm's own data: the Gray spring's range reads
`"(100 - 200 psi *cannot be used with 046-2)"`, and the 046-2 is the IRV body,
so an internal relief valve genuinely is not available on that spring. The
lookup now uses `.get()` and answers `"No"` - the regulator is sized and the
"Will IRV Work" column correctly says no. (The same file already used
`spring_map.get()` in `hsc_pnc046`, so the direct subscript looks like an
oversight.)

Pinned by the fixture "Gray spring: IRV correctly reported as unavailable".
Worth having a USG engineer confirm the conclusion.

## The PDF summary

Each block builds its own PDF client-side with jsPDF (loaded from
cdnjs.cloudflare.com), from the `summary`, `selection`, `part_numbers`,
`warnings` and `adjustments` the wrapper returns. If the CDN is blocked it
falls back to a print view of the same content.

Two things worth knowing when editing it:

* **Section spacing** lives in the `section()` helper inside each block:
  20pt above a heading, 9pt below, and a `checkPage(32)` reserve so a heading
  never strands at the foot of a page with its rows overleaf.
* **What appears in the Inputs table** comes from the wrapper's `summary`, not
  from the block. Adding a line means editing `wrapper.js` **and**
  `reference.py` together - they are compared field for field, so changing one
  alone fails the differential test. Then regenerate fixtures.

jsPDF cannot initialise under jsdom, so the browser tests verify that the
Download button appears and that the data behind it is correct, but not the
rendered page. Check a real download after changing PDF layout.

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
