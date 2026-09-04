# CONTINUITY

Everything a new person (or a future me) needs to pick this up. Written to be
read top to bottom once, then used as reference.

Last updated against `VERSION` 1.1.0.

---

## 1. What this is

Eight gas regulator sizing tools on hollandsupplycompany.com. Each one is a
form on a Concrete CMS page that sizes a USG regulator and returns a model,
capacity, part numbers, capacity tables and a downloadable PDF summary.

They replaced embedded Streamlit apps (iframes pointing at `*.streamlit.app`).
Nothing Streamlit remains in production.

**The algorithms are Python and stay Python.** They are the original engineering
scripts with only the interactive `input()`/`print()` sections removed. They are
compiled to JavaScript by a translator in this repo, and the tests prove the
JavaScript behaves identically. Nobody hand-writes the sizing logic in
JavaScript.

---

## 2. How a sizing gets from Python to a visitor

```
tools/<tool>/algorithm.py        the Python you edit  (source of truth)
      │
      │  build/build.py  →  build/transpile.py
      ▼
dist/usg-<tool>.js               generated bundle, committed to the repo
      │
      │  served by jsDelivr from GitHub
      ▼
tools/<tool>/block.html          pasted into the Concrete page; loads the
                                 bundle with a <script src> and renders results
```

`tools/<tool>/wrapper.js` sits between the two: it does the unit conversion,
validation, oversize maths and result formatting that the Streamlit front end
used to do, then calls the transpiled algorithm. `tools/<tool>/reference.py` is
its Python twin, and exists purely so the tests can compare the whole pipeline
rather than only the algorithm.

---

## 3. The single most important operational fact

**There are two deployable artefacts and they update by different routes.**
Nearly every "I made the change but nothing happened" moment traces to this.

| What you changed | Where it lives | How it reaches the site |
| --- | --- | --- |
| `algorithm.py`, `wrapper.js` — sizing results, validation messages, **and everything in the PDF's Inputs table** | `dist/usg-*.js`, served by jsDelivr | push to GitHub, wait for CI, **purge the CDN**, hard-refresh |
| `block.html` — page markup, styling, PDF layout, page copy, form fields | the pasted block | re-paste the block; instant |

A `@main` jsDelivr URL is cached for up to 12 hours. CI has a purge step, but if
an older workflow is running, purge manually:

```
https://purge.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-<tool>.js
```

**To check what a live page is actually running**, open its console and enter:

```js
USGSizing.versions
```

Compare the `algorithm` hash against the table in section 5. This is the
definitive answer and it settles the question in seconds.

---

## 4. Repository layout

```
tools/<tool>/              one folder per sizing tool, 8 files each
├─ algorithm.py            THE PYTHON YOU EDIT
├─ tool.json                 entry function, injected globals, output name, page
├─ wrapper.js                units, validation, result shaping
├─ reference.py              Python twin of wrapper.js, for the tests
├─ scenarios.json            test inputs: edge_cases, fixtures, fuzz ranges
├─ fixtures.json             expected output - generated, but committed
├─ block.html                the Concrete CMS block for that page
└─ form-map.js               how the browser test drives that form

build/
├─ transpile.py              Python → JavaScript translator
├─ build.py                  builds one tool or all
├─ difftest.py               proves the JavaScript matches the Python
├─ fault_sweep.py            finds inputs an algorithm cannot answer
├─ make_fixtures.py          regenerates expected results
├─ run_js.js                 runs a bundle over a batch of inputs
└─ browser_test.js           drives a block in a headless browser

dist/usg-<tool>.js          generated bundles - PUBLISHED via jsDelivr
.github/workflows/build.yml  build, verify, commit dist, purge the CDN
README.md, DEPLOYING.md, VERSION
```

---

## 5. The eight tools

| Tool | Page | Bundle | `algorithm` hash |
| --- | --- | --- | --- |
| all-models | `/resources/regulator-sizing-tools/general` | `usg-all-models.js` | `31223a399c16` |
| model-046 | `…/model-046` | `usg-model-046.js` | `208e4323a736` |
| model-121 | `…/model-121-122` | `usg-model-121.js` | `81ddc8bad2ef` |
| model-143 | `…/model-143` | `usg-model-143.js` | `a92413cd57bd` |
| model-243 | `…/model-243` | `usg-model-243.js` | `70c1d9cc096d` |
| model-461 | `…/model-441-461` | `usg-model-461.js` | `3e1a5a6c5018` |
| model-496 | `…/model-496` | `usg-model-496.js` | `f6502f86324b` |
| model-rpc | `…/model-243-rpc` | `usg-model-rpc.js` | `8bf4279e24d0` |

Bundles join a shared `window.USGSizing` namespace rather than replacing it
(`sizeAllModels`, `sizeModel046`, …), so two tools could coexist on one page.

### What differs between them

They look alike but the shapes genuinely differ; do not assume one is a copy of
another.

* **all-models** picks between every model family. No capacity tables. Its
  entry point returns five values. Its copy of `run_regulator_selection461`
  also takes `vp_preference`, supplied as an injected global (the 441/461 tool
  passes it as a function argument instead).
* **model-143, model-496** the simplest: IRV-only protection, a flat set of
  capacity tables, no monitor option.
* **model-046** IRV *or* monitor; tables grouped into labelled sections, and an
  IRV request shows **both** the IRV and Monitor families.
* **model-243** the most conditional tables: which family appears depends on
  outlet pressure and protection type across standard and high-pressure data,
  and an IRV request at ≥2 psi outlet is drawn as monitor tables.
* **model-121** returns **six** values (standard map, V-Port map, 122 map, then
  the selection). Tables list **body size** rather than orifice, drop six
  registers with no V-Port variant, and gate the PDF button on a separate
  `apply121` flag. Has a min-flow field.
* **model-461** entry takes the flows as **arguments**; tables come from the
  algorithm's own `build_standard_table()` / `build_vport_table()` with six
  columns including Qmax/Qmin. No pipe-size input. Has a **V-Port preference**
  input (`vp_preference`, `"standard"` or `"vport"`).
* **model-rpc** the only tool with a **model selector** (N/A (any) / 243-RPC /
  -A / -B), passed as `model_input`.

---

## 6. Making a change

### Change how sizing works

1. Edit `tools/<tool>/algorithm.py`.
2. `python3 build/build.py` — fails loudly if the Python uses a construct the
   translator does not support (see section 8).
3. `python3 build/difftest.py <tool>` — must report zero mismatches.
4. `python3 build/fault_sweep.py <tool>` — should report no new faults.
5. `python3 build/make_fixtures.py <tool>` — read the diff. **Intended** changes
   will alter fixtures; confirm the new numbers are right, then commit them.
6. `node build/browser_test.js <tool>`.
7. Push, wait for CI, purge that bundle, hard-refresh.

### Change the page, PDF layout or copy

Edit `tools/<tool>/block.html`, run `node build/browser_test.js <tool>`, then
re-paste the block. No push required for the site (push anyway to keep GitHub
honest).

### What else needs touching

| Change | Also update |
| --- | --- |
| Capacity numbers, thresholds, spring ranges, selection order, part-number format | Nothing |
| A new **output** field (new key in the `match` dict) | `wrapper.js` **and** `reference.py` field lists |
| A new **input** the user supplies | a control in `block.html`, its `buildInput()`, plus `wrapper.js` and `reference.py`; add it to `scenarios.json`'s `random` block |
| Renaming injected globals, the entry signature, or `match` keys | `wrapper.js`, `reference.py`, `tool.json` |

`wrapper.js` and `reference.py` **must change together** — they are compared
field for field, so editing one alone fails the differential test. That is the
point of having both.

### Adding a ninth tool

Copy an existing `tools/<slug>/` folder, drop in the Python, fill in
`tool.json`, adapt `wrapper.js` + `reference.py` + `block.html` + `form-map.js`,
add a `random` block to `scenarios.json`, and **add the slug to `matrix.tool`
in `.github/workflows/build.yml`** — otherwise CI silently ignores it.

---

## 7. Verification, and why it is not optional

* **`build/difftest.py`** runs the same inputs through the Python and through
  the exact JavaScript the site loads, comparing the **entire** result object:
  every selection field, capacity, part number, warning, adjustment, summary
  line, error message, and every cell of every capacity table. ~10,000 inputs
  per tool. Any difference fails the build.
* **`build/browser_test.js`** loads each real block in a headless browser and
  checks the rendered page against `fixtures.json`. 399 checks currently.
* **`build/fault_sweep.py`** walks each tool's input ranges looking for inputs
  the algorithm cannot answer (a spring colour missing from a table, and so on).
* **`fixtures.json`** pins exact expected output. CI fails if it is stale, which
  is what stops an accidental algorithm edit from silently changing what
  customers are told.

### Real bugs the differential test caught

Keep it in the pipeline. Every one of these was invisible by inspection:

* Python `list + list` concatenates lists; the naive JavaScript translation did
  string concatenation — wrong part numbers in one branch.
* `'N/A'['color']` raises `TypeError` in Python but silently returns `undefined`
  in JavaScript, producing a corrupted part number (`R.441-57S…None.I`) where
  Python correctly refused to size.
* `format(9.05, '.1f')` is `9.1` in Python; a scaled-rounding implementation
  gave `9.0`.
* `f"{x:,}"` keeps the decimal on a float (`5000.0` → `"5,000.0"`), which
  matters because model-121 computes min flow after the float conversion while
  other tools keep it an integer.
* `$GLOBALS` was hardcoded with the all-models global names, so a tool that did
  not inject a given global still reported it present via
  `'name' in globals()` — and then referenced an undefined variable. It is now
  generated per tool from `tool.json`.
* Computing the elevation reduction before validation made Python raise
  `ZeroDivisionError` when inlet equals outlet while JavaScript produced `NaN`.
  All eight tools had it; all now validate first.
* A bulk rename left "Model 461/122" in a user-facing message.
* Adding a parameter to `run_regulator_selection461` without updating its call
  site in `allmodels_selector` raised `TypeError` on every 461 selection. When
  changing a signature, grep for the call sites - there is one per tool.

---

## 8. The translator is a tool this team now owns

`build/transpile.py` (~600 lines) understands only the subset of Python the
algorithms currently use:

* `if`/`elif`/`else`, `for … in`, function definitions, assignment, augmented
  assignment, comparisons, arithmetic, f-strings, list/dict literals, slices,
  single-generator comprehensions
* builtins `abs`, `all`, `any`, `float`, `int`, `isinstance`, `len`, `list`,
  `max`, `min`, `round`, `sorted`, `str`, `globals`
* methods `.append`, `.get`, `.index`, `.items`, `.join`, `.keys`, `.lower`,
  `.strip`, `.startswith`, `.endswith`, `.upper`, `.values`

Anything else — `try`/`except`, `while`, classes, `import`, generators, sets —
**stops the build** with the offending line:

```
Unsupported stmt Try at line 2
```

That loud failure is deliberate: it can never emit questionable JavaScript.
When it happens, either rewrite that line within the subset or extend the
translator. Python semantics that had to be implemented carefully and should
not be "simplified": dicts become JS `Map`s (so numeric keys still sort
numerically), banker's rounding, value-preserving `and`/`or`, `.index()`
raising rather than returning `-1`, and subscript errors raising like Python's.

---

## 9. Known algorithm defects

Run `python3 build/fault_sweep.py` after any algorithm change. Current state:
**six of eight clean, one defect in two tools.**

### all-models and model-461: monitor sizing, 85–100 psi outlet (OPEN)

Both share `spring_57S()` / `spring_X57()`, so both carry it. `gen_match` sets a
monitor setpoint of `outlet_input + 15`; above 85 psi outlet that exceeds
100 psi, past the top of the 57S spring table, so `spring_57S()` returns the
string `'N/A'` and the next line subscripts it.

Reproduce in either tool: inlet 180 psi, outlet 90 psi, flow 800,000 CFH,
monitor protection. The page catches it and asks the customer to contact
Holland — safe but unhelpful.

**Left open deliberately: it needs a product decision, not a code fix.** The
57S series has no spring above 100 psi, so answering it means deciding what
monitor spring a 57S should use up there. Options, in the order we would
consider them:

1. **Reject the candidate**, so the selection loop falls through to
   `461-X57` / `441-X57`, whose table covers 75–250 psi. Safest, and probably
   what the logic intends.
2. **Borrow `spring_X57(monset)`** while keeping the 57S body. One line, but it
   asserts that spring fits that body — only USG can confirm.
3. **Leave it.** The window is narrow and the customer reaches a human.

Do **not** simply return `None` for the monitor spring: the tool would then
present a monitor selection with no monitor spring named, which is worse than
declining. Whichever you choose, apply it to **both**
`tools/all-models/algorithm.py` and `tools/model-461/algorithm.py` — they hold
separate copies. The input is pinned as an edge case in both.

### Fixed, for the record

* **model-046**: `will_irv_work046()` looked the spring up with
  `spring_map[spring]`; `spring_046()` returns `Gray` above 125 psi outlet and
  `None` above 200, so it raised `KeyError` and broke **every** IRV request with
  an outlet above ~125 psi (568 inputs on the sweep grid). The data settles it —
  the Gray spring's range reads "cannot be used with 046-2", and the 046-2 *is*
  the IRV body — so it now answers `"No"`.
* **model-rpc**: `spring_RPC()` tested `elif op < 35` with no `else`, returning
  `None` at 35 and above. Broke plain sizing at exactly 35 psi outlet (which
  validation allows) and **all** monitor sizing at ≥32 psi outlet, since the
  setpoint is capped at 35. Changed to `<= 35`.
* **model-rpc**: `model_input` is `"RPC"` when no variant is pinned — an
  internal sentinel, not a model name — and it reached the output verbatim,
  giving `Model: RPC` and a part number of `R.RPC.…`. Now translated through the
  existing label map to `243-RPC`.
* **model-rpc**: `output['contorlline']` (letters transposed) in three places
  would have silently hidden the control line kit on that tool only.

---

## 10. Add to Cart

Each result renders an **Add to Cart** link to a site endpoint that takes
matched `part[]` / `qty[]` pairs, adds each to the cart and redirects to the
cart page (or to a CMS "contact us" page if any part number is unrecognised).

```
https://hollandsupplycompany.com/api/sizing-tool/add-to-cart?part[]=…&qty[]=1&part[]=…&qty[]=2
```

Rules the blocks implement:

* Regulators first (worker, then monitor), each at quantity 1, then the control
  line kit at its own `controllineqty`.
* Values are `encodeURIComponent`'d and then `%2F` is **restored to `/`** —
  part numbers contain slashes (`R.143-1.3/4.16.11`) and the endpoint's
  documented example shows them unencoded. Spaces stay `%20` and the inch mark
  in `CONTROL LINE KIT - 441-1/2"` stays `%22`; both decode correctly.
* Pairs must alternate `part[],qty[]` so they line up server-side. The browser
  test parses the URL back apart and asserts this.

`hsc_pnc*` returns a dict: `worker`, optional `monitor`, optional `controlline`
and `controllineqty`. The kit appears on the page below the part numbers as
`CONTROL LINE KIT: 2` and in the cart, but **deliberately not in the PDF**.

### Open item: NetSuite reconciliation

A generated part number that is not in NetSuite cannot be added to the cart, and
the endpoint then redirects the whole attempt to the contact page — so one bad
part blocks an otherwise valid cart.

The tools can only emit a **finite** set: **1,358 distinct SKUs** (1,355
regulator part numbers plus 3 control line kits). The list was produced by
sweeping 12,000 randomised inputs per tool plus every pinned edge case, and
delivered as `usg-sizing-tool-skus.csv`. HSC is loading the missing ones into
NetSuite.

Check these three first — they are the only SKUs with spaces, one ends in an
inch mark, and they are the newest addition to the cart, so exact-string
matching is the likely failure:

```
CONTROL LINE KIT
CONTROL LINE KIT - 243-3/8
CONTROL LINE KIT - 441-1/2"
```

Caveats: the list is thorough but produced by sampling, not exhaustive
enumeration — a combination reachable only from a very narrow input window could
be missed. It should be regenerated after any algorithm change, since new
orifices or springs mean new part numbers. Worth promoting the ad-hoc script to
`build/list_skus.py`.

If gaps persist, the options considered were: a pre-flight validation endpoint
(best experience — fails before the click), an exception list shipped in the
bundle (no endpoint work, goes stale), and passing the attempted part numbers to
the contact page so it can show them and prefill a quote form.

---

## 11. Site configuration

Content Security Policy needs both CDNs:

```
script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
```

`cdn.jsdelivr.net` serves the algorithms; `cdnjs.cloudflare.com` serves jsPDF
for the Download PDF Summary button. The old
`frame-src https://*.streamlit.app` entry from the iframe era is not needed.

The repository **must stay public** — jsDelivr cannot read a private repo, and
neither can a visitor's browser.

---

## 12. Page layout conventions

All eight blocks follow the same shape, and the browser test pins the order:

1. Breadcrumb, `<h1>`, intro copy and notes (merged in from the old
   "text-only" blocks; the separate blocks were deleted from the pages)
2. Inputs
3. Run Sizing
4. **Results**: Regulator Selection — model, sizes, spring, capacity, then
   `Part Number` and `Monitor Part Number` and the control line kit as fields —
   then Add to Cart, then Download PDF Summary, then capacity tables, then
   Sizing Adjustments

Details that were deliberate and are easy to undo by accident:

* Sizes are in **px**, not `rem`, with `!important` guards. The Concrete theme
  sets a non-16px root size and restyles headings, so rem-based sizing shrank
  the whole tool and the theme recoloured the headings.
* Number inputs have no +/- steppers and native spinners are suppressed.
* Info icons are a circled **i** with a custom tooltip (hover, tap, keyboard,
  auto-positioned so it never clips). The browser `title` attribute was useless
  on touch devices.
* Capacity tables scroll horizontally on narrow screens rather than squashing;
  Yes/No cells are colour-coded.
* Each block's PDF and print-fallback subtitle must match its own `<h1>`. Three
  blocks once shipped with "Model 121 Sizing Tool" in the PDF heading because
  they were derived from that block; there is now a test for it.
* The PDF build is **reproducible** — no timestamp is embedded — so `dist/` only
  changes when sources change. A clock in there caused CI to republish every
  bundle on every push.

---

## 13. Open items

1. **The 85–100 psi monitor spring defect** (section 9) — awaiting a product
   decision from USG; apply to both all-models and model-461.
2. **NetSuite SKU reconciliation** (section 10) — HSC loading missing part
   numbers; verify the three control line kits first.
3. **Promote the SKU lister** to `build/list_skus.py` so regenerating the list
   is one command.
4. **Confirm the workflow in GitHub is current.** A run finishing in ~44s is a
   sign of an older workflow: the current one diff-tests ~10,000 inputs across
   eight tools and takes several minutes. An old workflow also lacks the
   automatic CDN purge, which makes algorithm changes appear not to work.
5. **Quantity is fixed at 1** per regulator in the cart. Add a quantity input if
   customers should be able to order several.
6. Optional: exhaustive SKU enumeration from the capacity tables rather than
   sampling.

---

## 14. Things that bit us, in one list

* Pasting a block does nothing for an algorithm change — that lives in the CDN
  bundle. Check `USGSizing.versions`.
* `@main` jsDelivr URLs cache for 12 hours. Purge, or rely on CI's purge step.
* `.github/` is a dot-folder: drag-and-drop upload skips it. Type the path in
  **Add file → Create new file** instead.
* Actions needs **Read and write** workflow permissions, or the build passes but
  never commits the rebuilt `dist/`.
* Editing `wrapper.js` without `reference.py` (or vice versa) fails the
  differential test — by design.
* Bulk find-and-replace across a block leaks the wrong tool's name into user
  copy. Check the PDF subtitle after any rename.
* Adding a tooltip changes the count that `form-map.js` asserts.
* jsPDF cannot initialise under jsdom, so the browser tests verify the PDF's
  *data* but not its rendered layout. Download a real PDF after changing PDF
  layout.
