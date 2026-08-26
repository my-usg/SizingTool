# Deploying

One-time setup, then every future change is just "edit the Python and push".

Repository: <https://github.com/my-usg/sizingtool>

---

> **Already deployed once?** The repository has been reorganised to hold
> multiple tools. Skip to [Updating an existing repository](#updating-an-existing-repository)
> at the bottom - your live page needs no changes.

## 1. Put the code on GitHub

If the repository is empty, from inside the unzipped folder:

```bash
git init
git add .
git commit -m "Sizing tool: Python algorithm, transpiled JS build, website block"
git branch -M main
git remote add origin https://github.com/my-usg/sizingtool.git
git push -u origin main
```

If the repository already has files in it, clone it first and copy these files
in, so you keep its history:

```bash
git clone https://github.com/my-usg/sizingtool.git
cd sizingtool
# copy the contents of the unzipped folder in here, then:
git add .
git commit -m "Sizing tool: Python algorithm, transpiled JS build, website block"
git push
```

## 2. Make the repository public

**Settings → General → Danger Zone → Change repository visibility → Public.**

This is required. jsDelivr serves files to visitors' browsers and cannot read a
private repository - and neither can the browser. If the repo must stay
private, this architecture will not work and you would need the server-based
version instead.

## 3. Let the build commit its output

**Settings → Actions → General → Workflow permissions → "Read and write
permissions" → Save.**

Without this the build succeeds but cannot push the rebuilt
`dist/usg-all-models.js`, and the site will keep serving the old version. This
is the single most common thing to miss.

## 4. Run the build once

**Actions → "Build and verify" → Run workflow → Run.**

Watch it go green. It will:

1. transpile each tool's `algorithm.py` to JavaScript,
2. run ~10,000 inputs through both Python and the generated JavaScript and
   compare every field,
3. drive the website block in a headless browser against expected results,
4. commit any bundle in `dist/` that changed.

If any step fails, nothing is published. Read the log - the failure message
names the offending line or input.

## 5. Check the file is live

Open this in a browser:

<https://cdn.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-all-models.js>

You should see JavaScript beginning with a comment block that includes a
version, an algorithm hash and a build timestamp. If you get a 404, the build
has not committed `dist/` yet - go back to step 3.

## 6. Allow the CDN in the site's Content Security Policy

The tool loads two scripts from CDNs, so `script-src` must include both:

```
script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
```

* `cdn.jsdelivr.net` - the sizing algorithm from your repository.
* `cdnjs.cloudflare.com` - jsPDF, used by the Download PDF Summary button.

The `frame-src https://*.streamlit.app` entry that was added for the old
embedded version is no longer needed and can be removed.

If sizing reports "The sizing algorithm could not be loaded", this is almost
always the cause. Open the browser console (F12) and look for a Content
Security Policy error naming `cdn.jsdelivr.net`.

## 7. Paste the blocks into their pages

Each tool has its own block and its own page:

| Page | Block file |
| --- | --- |
| `/resources/regulator-sizing-tools/general` | `tools/all-models/block.html` |
| `/resources/regulator-sizing-tools/model-143` | `tools/model-143/block.html` |
| `/resources/regulator-sizing-tools/model-046` | `tools/model-046/block.html` |
| `/resources/regulator-sizing-tools/model-243` | `tools/model-243/block.html` |
| `/resources/regulator-sizing-tools/model-496` | `tools/model-496/block.html` |
| `/resources/regulator-sizing-tools/model-121-122` | `tools/model-121/block.html` |
| `/resources/regulator-sizing-tools/model-243-rpc` | `tools/model-rpc/block.html` |
| `/resources/regulator-sizing-tools/model-441-461` | `tools/model-461/block.html` |

Open the page, edit its HTML block, and replace the contents with that file.
Any page that does not exist yet will need creating;
if you use different URLs, update `"page"` in that tool's `tool.json` so the
tests mirror reality.

Keep the "Preliminary selection only" disclaimer paragraph and the Report a Bug
button from the old block - they are page content, not part of the tool, and
can sit below it in the same block.

## 8. Test it on the live pages

**All models.** Enter inlet 19 psi, outlet 1 psi, flow 12321 CFH, overpressure protection Yes →
Monitor regulator, generator/high-efficiency Yes at 50%, override oversize Yes
at 35%. You should get:

* Model **461-S**, 8" Al diaphragm, 2" ANSI125 body, 1" double orifice
* Calculated Capacity **23,380** CFH
* Part numbers `R.461-S.2FLG125.20D.B.13` and `R.461-S.2FLG125.20D.B.14`

**Model 143.** Enter inlet 25 psi, outlet 0.25 psi, flow 500 CFH. You should get
Model **143-1**, 3/4" body, capacity **1,300** CFH, part number
`R.143-1.3/4.14.11`, and three capacity tables below it. Set overpressure
protection to Yes and re-run: each table gains a **Will IRV Work** column and a
"Sized for IRV" notice appears.

**Model 046.** Enter inlet 100 psi, outlet 20 psi, flow 12000 CFH. You should
get Model **046**, 1" body, 1/2" orifice, capacity **19,900** CFH, part number
`R.046-1.STD.1.15.TAN.25.ALU`. Set overpressure protection to Yes with IRV and
re-run: the tables split into **With IRV** and **With Monitor** sections, six
tables in total.

**Model 243.** Enter inlet 25 psi, outlet 1 psi, flow 3000 CFH. You should get
Model **243-8-1**, 1-1/4" body, capacity **7,500** CFH, part number
`R.243-8-1.1-1/4SCD.INT.18.STD.12.ALU`, and seven capacity tables. Change the
outlet to 4 psi and re-run: only the three 243-8 tables appear. Change it to
8 psi: the 243-8HP tables appear instead.

**Model 496.** Enter inlet 25 psi, outlet 0.5 psi, flow 500 CFH. You should get
capacity **1,375** CFH, part number `R.496-20.3/4.14.10`, and four capacity
tables. Set overpressure protection to Yes and re-run: each table gains a
**Will IRV Work** column.

**Model 121/122.** Enter inlet 10 psi, outlet 0.5 psi, flow 5000 CFH. You
should get capacity **13,392** CFH, an outlet pipe sizing note, and two table
groups: **Standard Valves** (five tables, including the 122 models) and
**V-Port Valves** (two). Raise the outlet to 2.5 psi and the 122 tables drop
out; to 5 psi and only the high-pressure models remain. Set overpressure
protection to Yes and a "Capacity reduction due to monitor shown." caption
appears above the tables.

**Model 243-RPC.** Enter inlet 25 psi, outlet 1 psi, flow 10000 CFH. You should
get capacity **21,800** CFH, an outlet pipe sizing note, and two capacity
tables. This tool also has a **Desired RPC model** selector: choose 243-RPC-B
and the selected model changes accordingly. Set overpressure protection to Yes
and a "Capacity reduction due to monitor shown." caption appears.

**Model 441/461.** Enter inlet 100 psi, outlet 20 psi, flow 50000 CFH. You
should get capacity **74,360** CFH and two tables - **Standard Valves** and
**V-Port Valves** - each with six columns including Qmax and Qmin. Set
overpressure protection to Yes and a "Capacity reduction due to monitor shown."
caption appears above them.

Then check each on a phone, and check the Download PDF Summary buttons.

---

## Publishing a change later

```bash
# edit tools/all-models/algorithm.py
git commit -am "Describe the change"
git push
```

The build verifies and republishes automatically. The site picks it up within
12 hours (jsDelivr's cache window for a branch URL). To make it immediate, load
this once in a browser:

<https://purge.jsdelivr.net/gh/my-usg/sizingtool@main/dist/usg-all-models.js>

Then hard-refresh the page (Ctrl+F5).

### If you prefer explicit control over when the site changes

Pin a tag instead of tracking `main`:

```bash
git tag v1.1.0
git push --tags
```

and change the block's script tag to `@v1.1.0`. Nothing on the site changes
until you edit that tag, and tagged URLs never need purging. The cost is a
manual block edit per release.

---

## Rolling back

The site can be reverted without touching the repository: change the block's
script tag to a specific commit, which jsDelivr serves permanently.

```
https://cdn.jsdelivr.net/gh/my-usg/sizingtool@COMMIT_SHA/dist/usg-all-models.js
```

Take the SHA from the repository's commit history. To roll back properly,
`git revert` the change and push; the build republishes the previous behaviour.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "The sizing algorithm could not be loaded" | CSP is missing `cdn.jsdelivr.net`, or the `dist/` file 404s (build has not committed yet). |
| Build is green but the site shows old results | jsDelivr cache - purge the URL, then hard-refresh. |
| Build fails at "Commit rebuilt bundle" with a permissions error | Step 3: workflow permissions are read-only. |
| Build fails with `Unsupported stmt ... at line N` | The Python uses a construct the transpiler does not handle. See the supported subset in the README. |
| A new tool builds locally but CI ignores it | Its slug is missing from `matrix.tool` in `.github/workflows/build.yml`. |
| Build fails at "Verify JavaScript matches Python" | The generated JavaScript disagrees with the Python. Do not publish; the log prints the exact input and both results. |
| Build fails at "Check fixtures are current" | The algorithm now produces different results. If intended, run `python3 build/make_fixtures.py <tool>` and commit. |
| Download PDF does nothing | CSP is missing `cdnjs.cloudflare.com`; the tool falls back to a print view. |

---

## Updating an existing repository

The repository now holds several tools, so files moved. The all-models tool
behaves identically - **your live page needs no edit, and no CSP change.** The
bundle keeps its filename (`dist/usg-all-models.js`), so the deployed block
still points at the right file.

What moved:

| Before | Now |
| --- | --- |
| `algorithm/all_models.py` | `tools/all-models/algorithm.py` |
| `src/wrapper.js` | `tools/all-models/wrapper.js` |
| `tools/sizing_reference.py` | `tools/all-models/reference.py` |
| `web/sizing-tool-block.html` | `tools/all-models/block.html` |
| `tests/fixtures.json` | `tools/all-models/fixtures.json` |
| `tools/transpile.py`, `tools/build.py`, `tools/difftest.py`, `tools/run_js.js` | `build/` |
| `tests/make_fixtures.py`, `tests/browser_test.js` | `build/` |

The simplest way to apply it, since old folders must disappear rather than
merge:

```bash
git clone https://github.com/my-usg/sizingtool.git
cd sizingtool
git rm -r --cached algorithm src tests web tools dist
rm -rf algorithm src tests web tools dist
# copy the contents of the new zip in here, then:
git add -A
git commit -m "Reorganise for multiple tools"
git push
```

If you upload through the browser instead, **delete the old `algorithm/`,
`src/`, `tests/`, `web/` and `tools/` folders first** - otherwise the old build
scripts linger in `tools/` alongside the new tool folders and CI may pick up
stale copies.

One expected side effect: the first build after this commits `usg-all-models.js`
once more. The content is identical apart from the header (the build no longer
embeds a timestamp), so nothing about sizing changes. From then on, a bundle is
only republished when its sources genuinely change.
