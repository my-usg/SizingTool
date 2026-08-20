// ---- UI layer: collects the form and calls the sizing algorithm ----
// The algorithm itself is not in this file. It is loaded from GitHub via
// jsDelivr (see the <script> tag above) and exposed as window.USGSizing.

var $root = document.getElementById('usg-sizing-tool');
function $(id) { return document.getElementById('usg-' + id); }

var PIPE_OPTIONS = ["N/A", '3/8"', '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"'];

// ---- widget state readers ----
function numVal(id) {
  var v = parseFloat($(id).value);
  return isNaN(v) ? 0 : v;
}
function intVal(id) {
  var v = parseInt($(id).value, 10);
  return isNaN(v) ? 0 : v;
}
function radioVal(name) {
  var els = $root.querySelectorAll('input[name="usg-' + name + '"]');
  for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
  return null;
}

// ---- conditional visibility (mirrors the Streamlit widget tree) ----
function refreshConditionals() {
  var opp_choice = radioVal('opp');
  $('opp-yes-block').style.display = (opp_choice === "Yes") ? '' : 'none';
  $('opp-no-block').style.display = (opp_choice === "No") ? '' : 'none';
  var opp_pref = radioVal('opppref');
  $('irv-input-block').style.display =
    (opp_choice === "Yes" && opp_pref !== null && opp_pref.indexOf("IRV") !== -1) ? '' : 'none';

  $('pload-block').style.display = (radioVal('higheff') === "Yes") ? '' : 'none';
  $('oversize-block').style.display = (radioVal('override') === "Yes") ? '' : 'none';
  $('sg-block').style.display = ($('gastype').value === "Other") ? '' : 'none';
  $('patm-block').style.display = (radioVal('elevation') === "Yes") ? '' : 'none';

  $('pload-val').textContent = $('pload').value;
  $('oversize-val').textContent = $('oversize').value;

  reqLabel('inlet', numVal('inlet'));
  reqLabel('outlet', numVal('outlet'));
  reqLabel('flow', intVal('flow'));
}
function reqLabel(id, val) {
  var el = $('label-' + id);
  if (!val) el.classList.add('usg-req'); else el.classList.remove('usg-req');
}
function clampInput(el) {
  if (el.value === '') return;
  var v = parseFloat(el.value); if (isNaN(v)) return;
  var min = el.hasAttribute('min') ? parseFloat(el.getAttribute('min')) : -Infinity;
  var max = el.hasAttribute('max') ? parseFloat(el.getAttribute('max')) : Infinity;
  if (v < min) el.value = String(min);
  if (v > max) el.value = String(max);
}

// ---- rendering helpers ----
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function alertBox(kind, html) { return '<div class="usg-alert usg-' + kind + '">' + html + '</div>'; }

// ---- collect the form ----
function buildInput() {
  var opp_required = radioVal('opp') === "Yes";
  var opp_pref_raw = radioVal('opppref') || "";

  return {
    inlet: numVal('inlet'),
    inlet_units: $('inlet-units').value,
    outlet: numVal('outlet'),
    outlet_units: $('outlet-units').value,
    flow: intVal('flow'),
    min_flow: intVal('minflow'),
    flow_units: $('flow-units').value,
    maop: intVal('maop'),
    pipe_size: PIPE_OPTIONS[parseInt($('pipesize').value, 10)],
    opp_required: opp_required,
    opp_pref: opp_pref_raw.indexOf("IRV") !== -1 ? "IRV" : "Monitor",
    irv_pressure: numVal('irv'),
    partial_irv: !opp_required && radioVal('partial') === "Yes",
    high_efficiency: radioVal('higheff') === "Yes",
    high_efficiency_pct: parseInt($('pload').value, 10),
    override_oversize: radioVal('override') === "Yes",
    oversize_pct: parseInt($('oversize').value, 10),
    prefer_combustion: radioVal('combust') === "Yes",
    gas_type: $('gastype').value,
    specific_gravity: numVal('sg'),
    high_altitude: radioVal('elevation') === "Yes",
    atmospheric_pressure: numVal('patm')
  };
}

var lastRun = null; // stored for the PDF download

// ---- main run handler ----
function runSizing() {
  var out = $('output');

  if (!window.USGSizing || typeof window.USGSizing.sizeAllModels !== 'function') {
    out.innerHTML = alertBox('error',
      'The sizing algorithm could not be loaded. Please refresh the page, and if the problem persists contact Holland Supply Company.');
    return;
  }

  out.innerHTML = '<div class="usg-spinner"><span class="usg-spin"></span>Sizing regulator\u2026</div>';

  // Yield once so the spinner paints before the calculation runs.
  setTimeout(function () {
    var result;
    try {
      result = window.USGSizing.sizeAllModels(buildInput());
    } catch (err) {
      if (window.console && console.error) console.error('USG sizing failed', err);
      out.innerHTML = alertBox('error', 'Something went wrong while sizing. Please try again.');
      return;
    }
    render(result);
  }, 30);
}

// ---- render the result ----
function render(body) {
  var out = $('output');
  var html = '';
  lastRun = null;

  if (!body || body.ok !== true) {
    var errs = (body && body.errors) ? body.errors : ["Unexpected result from the sizing algorithm."];
    for (var e = 0; e < errs.length; e++) html += alertBox('error', esc(errs[e]));
    out.innerHTML = html;
    return;
  }

  var warnings = body.warnings || [];
  for (var w = 0; w < warnings.length; w++) html += alertBox('warning', esc(warnings[w]));

  if (!body.selected) {
    html += alertBox('error', '\u274C&nbsp; ' + esc(body.message || "No USG regulators will work for this application."));
    out.innerHTML = html;
    return;
  }

  html += alertBox('success', '\u2705&nbsp; ' + esc(body.message || "Regulator selected!"));

  html += '<h3 class="usg-h3">Regulator Selection</h3>';
  var sel = body.selection || [];
  for (var i = 0; i < sel.length; i++) {
    html += '<p class="usg-field"><strong>' + esc(sel[i].label) + ':</strong> ' + esc(sel[i].value) + '</p>';
  }
  if (body.capacity) {
    html += '<p class="usg-field"><strong>Calculated Capacity (CFH):</strong> ' + esc(body.capacity) + '</p>';
  }

  var pns = body.part_numbers || [];
  if (pns.length) {
    html += '<h3 class="usg-h3">HSC Part Number(s)</h3>';
    for (var p = 0; p < pns.length; p++) {
      html += '<pre class="usg-code"><code>' + esc(pns[p]) + '</code></pre>';
    }
  }

  if (body.pipe_note) {
    html += alertBox('info', '\u2139\uFE0F&nbsp; ' + esc(body.pipe_note));
  }

  var adj = body.adjustments || [];
  if (adj.length) {
    html += '<hr class="usg-hr">';
    html += '<h3 class="usg-h3">Sizing Adjustments</h3>';
    html += '<table class="usg-table"><thead><tr><th>Adjustment</th><th>Value</th></tr></thead><tbody>';
    for (var a = 0; a < adj.length; a++) {
      html += '<tr><td>' + esc(adj[a].label) + '</td><td>' + esc(adj[a].value) + '</td></tr>';
    }
    html += '</tbody></table>';
  }

  lastRun = {
    summary: body.summary || [],
    selection: sel,
    capacity: body.capacity || '',
    pns: pns,
    msgs: warnings,
    adjustments: adj
  };

  html += '<hr class="usg-hr">';
  html += '<h3 class="usg-h3">Download PDF Summary</h3>';
  html += '<button type="button" class="usg-btn" id="usg-pdf-btn">\u2B07\uFE0F&nbsp; Download PDF Summary</button>';

  out.innerHTML = html;
  var pdfBtn = $('pdf-btn');
  if (pdfBtn) pdfBtn.addEventListener('click', downloadPdf);
}

