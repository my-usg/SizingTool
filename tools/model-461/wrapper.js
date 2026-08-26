// ============================================================================
//  Wrapper around the transpiled Model 441/461 algorithm.
//
//  Everything the Streamlit front end used to do around
//  run_regulator_selection461(): unit conversion, validation, oversize maths,
//  the Standard and V-Port capacity tables and result formatting.
//
//  This file is hand-written, NOT generated. Its Python twin is reference.py
//  in this same folder, and CI proves the two agree on every input it tests,
//  so this cannot silently drift from the algorithm's expectations.
//
//  build/build.py exposes this as USGSizing.sizeModel461(input), per the
//  "method" field in tool.json.
// ============================================================================

// This tool has no pipe-size input and no per-register V-Port exclusions: its
// two tables come from the algorithm's own build_standard_table() and
// build_vport_table(), which return ready-made rows.
var INLET_UNITS = ["psi", "bar", "kPa"];
var OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"];
var FLOW_UNITS = ["CFH", "CMH", "BTUH"];
var GAS_TYPES = ["Natural Gas", "Propane", "Other"];
var PIPE_OPTIONS = ["N/A"];   // kept for the shared options payload

var TABLE_HEADERS = ["Applicable Models", "Body", "Orifice",
                     "Qmax (CFH)", "Qmin (CFH)", "Will Reg Work"];

function toPsi(val, units) {
  if (units === "in wc") return val * (1 / 28);
  if (units === "bar") return val * 14.5;
  if (units === "oz") return val / 16;
  if (units === "kPa") return val / 6.89476;
  return val;
}

function kv(label, value) {
  return { label: String(label), value: String(value) };
}

// The original tool's pressure inputs were floats (Streamlit format "%.1f"),
// so the summary showed "19.0", not "19". Render the same way Python's
// str(float) does, rather than relying on JavaScript's Number formatting.
function pyFloatStr(x) {
  var n = Number(x);
  if (!isFinite(n)) return String(x);
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

// Python's f"{x:,}" on a FLOAT keeps the decimal: 5000.0 -> "5,000.0". In this
// tool min_flow is computed after the float conversion, so the original tool
// prints it that way - unlike flow_rate, which stays an integer.
function pyFloatCommaStr(x) {
  var s = pyFloatStr(x);
  var neg = s.charAt(0) === '-';
  if (neg) s = s.slice(1);
  var dot = s.indexOf('.');
  var whole = dot === -1 ? s : s.slice(0, dot);
  var rest = dot === -1 ? '' : s.slice(dot);
  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + whole + rest;
}

function defaulted(input) {
  var d = {
    inlet: 0, inlet_units: "psi",
    outlet: 0, outlet_units: "psi",
    flow: 0, min_flow: 0, flow_units: "CFH",
    maop: 0,
    opp_required: false,
    high_efficiency: false, high_efficiency_pct: 100,
    override_oversize: false, oversize_pct: 25,
    gas_type: "Natural Gas", specific_gravity: 0.6,
    high_altitude: false, atmospheric_pressure: 14.40
  };
  input = input || {};
  for (var k in input) {
    if (Object.prototype.hasOwnProperty.call(input, k) && input[k] !== undefined && input[k] !== null) {
      d[k] = input[k];
    }
  }
  return d;
}

// The algorithm's table functions already return the rows; this only formats
// the numbers the way the Streamlit app's table_to_df did.
function tableFrom(title, rows) {
  if (!rows || !rows.length) return null;
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    out.push([
      $get(row, 'model'),
      $get(row, 'body'),
      $get(row, 'orifice'),
      $format($get(row, 'qmax'), ',.0f'),
      $format($get(row, 'qmin'), ',.0f'),
      $get(row, 'yn')
    ]);
  }
  return { title: title, headers: TABLE_HEADERS, rows: out };
}

function sizeTool(rawInput) {
  var p = defaulted(rawInput);

  // Match the widget types of the original tool: pressures are floats,
  // flows and MAIP are whole numbers.
  var inlet_input = Number(p.inlet);
  var outlet_input = Number(p.outlet);
  var flow_rate = Math.trunc(Number(p.flow));
  var min_flow_raw = Math.trunc(Number(p.min_flow));
  var maop = Math.trunc(Number(p.maop));

  // The 441/461 offers monitor protection only - there is no IRV option.
  var opp_type = p.opp_required ? "Monitor" : "None";

  // ---- oversizing ----
  var pload = 0.0;
  var pload_pct = 0;
  if (p.high_efficiency) {
    pload_pct = p.high_efficiency_pct;
    pload = pload_pct / 100.0;
  }
  var oversizeby = 1.25 + (0.75 * pload);
  var oversize_percent = (oversizeby - 1) * 100;
  if (p.override_oversize) {
    oversizeby = 1 + (p.oversize_pct / 100);
    oversize_percent = (oversizeby - 1) * 100;
  }

  // ---- gas type ----
  var gastypemult = 1.0;
  if (p.gas_type === "Propane") {
    gastypemult = 0.63;
  } else if (p.gas_type === "Other") {
    gastypemult = Math.min(1.0, Math.pow(0.6 / p.specific_gravity, 0.5));
  }

  var Patm = p.high_altitude ? Number(p.atmospheric_pressure) : 14.4;

  var inlet_psi = toPsi(inlet_input, p.inlet_units);
  var outlet_psi = toPsi(outlet_input, p.outlet_units);

  // ---- validation (same rules, wording and order as the original tool) ----
  var errors = [];
  if (inlet_psi > 0 && (inlet_psi > 1000 || inlet_psi < 7 / 28)) {
    errors.push("Inlet pressure must be between 7\" wc and 1,000 psi.");
  }
  if (outlet_psi > 0 && (outlet_psi < 2 / 28 || outlet_psi > 250)) {
    errors.push("Outlet pressure must be between 2\" wc and 250 psi.");
  }
  if (inlet_psi > 0 && outlet_psi > 0 && outlet_psi >= inlet_psi) {
    errors.push("Outlet pressure must be less than inlet pressure.");
  }
  if (Math.trunc(maop) !== 0 && maop < inlet_psi) errors.push("MAIP must be >= inlet pressure.");
  if (inlet_psi === 0) errors.push("Inlet pressure is required.");
  if (outlet_psi === 0) errors.push("Outlet pressure is required.");
  if (flow_rate === 0) errors.push("Please enter a max gas load / flow rate.");
  if (min_flow_raw > 0 && min_flow_raw > flow_rate) {
    errors.push("Minimum flow must be \u2264 maximum flow rate.");
  }

  if (errors.length) return { ok: false, errors: errors };

  // ---- elevation capacity reduction ----
  // Computed AFTER validation on purpose: when inlet equals outlet this
  // formula divides by zero (both the numerator and denominator collapse).
  // That input is always rejected above, so the figure is never needed - but
  // computing it first made Python raise ZeroDivisionError while JavaScript
  // quietly produced NaN. Same reason in reference.py.
  var elevation_reduction;
  if (Patm < 14.4) {
    var ratio = (inlet_psi + Patm) / (outlet_psi + Patm);
    if (ratio < 1.894) {
      elevation_reduction = 100 * (1 - Math.pow((outlet_psi + Patm) * ((inlet_psi + Patm) - (outlet_psi + Patm)), 0.5) /
        Math.pow((outlet_psi + 14.65) * ((inlet_psi + 14.65) - (outlet_psi + 14.65)), 0.5));
    } else {
      elevation_reduction = 100 * (1 - (inlet_psi + Patm) / (inlet_psi + 14.65));
    }
  } else {
    elevation_reduction = 0;
  }


  // ---- flow unit conversion ----
  var flow_cfh = flow_rate;
  var min_flow = (min_flow_raw === 0) ? flow_cfh : min_flow_raw;
  var maop_psi = (maop === 0) ? inlet_psi : maop;

  if (p.flow_units === "CMH") {
    flow_cfh = flow_cfh * 35.3147;
    min_flow = min_flow * 35.3147;
  } else if (p.flow_units === "BTUH") {
    if (p.gas_type === "Natural Gas") {
      flow_cfh = flow_cfh / 1000;
      min_flow = min_flow / 1000;
    } else if (p.gas_type === "Propane") {
      flow_cfh = flow_cfh / 2516;
      min_flow = min_flow / 2516;
    } else {
      return {
        ok: false,
        errors: ["BTUH conversion only supported for Natural Gas or Propane. Use CFH or CMH."]
      };
    }
  }

  // ---- inject the script globals and run ----
  // NOTE: inlet_input/outlet_input above are the values the user typed and are
  // reported back in the summary. The algorithm's own globals of the same name
  // get the converted psi values, and are set only via $setGlobals.
  $setGlobals({
    inlet_input: inlet_psi,
    outlet_input: outlet_psi,
    flow_rate: flow_cfh,
    min_flow: min_flow,
    maop: maop_psi,
    opp_type: opp_type,
    oversizeby: oversizeby,
    oversize_percent: oversize_percent,
    gastypemult: gastypemult,
    pload: pload,
    Patm: Patm
  });

  var match, ok, warning, stdTable, vpTable;
  try {
    // Unlike the other tools the flows are ARGUMENTS here, not just globals,
    // and the entry returns three values. The two capacity tables come from
    // their own functions rather than a shared result map.
    var r = run_regulator_selection461(inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type);
    match = r[0];
    ok = r[1];
    warning = r[2];
    stdTable = build_standard_table(inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type);
    vpTable = build_vport_table(inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type);
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 461 sizing algorithm error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  var warnings = $truthy(warning) ? [warning] : [];

  function mget(key) {
    return (match instanceof Map) ? match.get(key) : (match ? match[key] : null);
  }

  // This tool returns an explicit ok flag; the original shows the error box
  // when it is false and never reads the match in that case.
  var selected = !!$truthy(ok);

  var out = {
    ok: true,
    selected: selected,
    errors: [],
    warnings: warnings,
    message: selected ? "Regulator selected!" : "Model 441/461 will not work for this application."
  };

  if (selected) {
    var monSpring = null;
    if (mget('mon_color') !== null && mget('mon_color') !== undefined && mget('mon_color') !== "N/A") {
      var mr = mget('mon_range');
      monSpring = (String(mget('mon_color')) + ' ' + String(mr === null || mr === undefined ? '' : mr)).trim();
    }
    var sc = mget('color'), sr = mget('range');
    var rawFields = [
      ["Model", mget('model')],
      ["Body Size", mget('body')],
      ["Orifice Size", mget('orifice')],
      ["Seat", mget('seat')],
      ["Spring", (String(sc === null || sc === undefined ? '' : sc) + ' ' +
                  String(sr === null || sr === undefined ? '' : sr)).trim()],
      ["Monitor Spring", monSpring]
    ];
    var selection = [];
    for (var f = 0; f < rawFields.length; f++) {
      if ($truthy(rawFields[f][1])) selection.push(kv(rawFields[f][0], rawFields[f][1]));
    }
    out.selection = selection;

    var cap = mget('capacity');
    out.capacity = null;
    if ($truthy(cap) && cap !== "N/A") {
      var capNum = parseFloat(cap);
      out.capacity = isNaN(capNum) ? String(cap) : $format($round(capNum), ',');
    }

    var pns = [];
    var pn = hsc_pnc461(match);
    var pnList = Array.isArray(pn) ? pn : [pn];
    for (var q = 0; q < pnList.length; q++) if ($truthy(pnList[q])) pns.push(pnList[q]);
    out.part_numbers = pns;
  }

  // ---- capacity tables ----
  // Two fixed groups, built by the algorithm itself. Guarded like the
  // selection run so a lookup outside a table produces a readable message
  // rather than a broken page.
  var sections = [];
  try {
    var stdOut = tableFrom("Standard Valves", stdTable);
    if (stdOut) sections.push({ label: null, tables: [stdOut] });
    var vpOut = tableFrom("V-Port Valves", vpTable);
    if (vpOut) sections.push({ label: null, tables: [vpOut] });
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 461 table build error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }
  out.sections = sections;

  // Shown above the tables when a monitor is in play.
  out.tables_caption = (opp_type !== "None") ? "Capacity reduction due to monitor shown." : null;

  // ---- sizing adjustments ----
  var adjustments = [kv("Oversized By", $format(oversize_percent, ".0f") + "%")];
  if (selected && mget('opp') === "Monitor") adjustments.push(kv("Monitor Capacity Reduction", "30%"));
  if (gastypemult !== 1) adjustments.push(kv("Gas Type Factor", $format(gastypemult, ".4f")));
  if (Patm < 14.4) adjustments.push(kv("Elevation capacity reduction", $format(elevation_reduction, ".0f") + "%"));
  out.adjustments = adjustments;

  // ---- input summary (drives the PDF; same keys and order as the original) ----
  var summary = [
    kv("Inlet Pressure (" + p.inlet_units + ")", pyFloatStr(inlet_input)),
    kv("Outlet Pressure (" + p.outlet_units + ")", pyFloatStr(outlet_input)),
    kv("Max Flow Rate (" + p.flow_units + ")", $format(flow_rate, ',')),
    kv("Min Flow Rate (" + p.flow_units + ")", pyFloatCommaStr(min_flow)),
    kv("Max Allowable Inlet Pressure (psi)", String(Math.trunc(maop))),
    kv("Overpressure Protection Required", p.opp_required ? "Yes" : "No"),
    kv("Percent Load Feeding High-Efficiency Appliance", p.high_efficiency ? (pload_pct + "%") : "0"),
    kv("Override percentage regulator is oversized by",
      p.override_oversize ? ($format(oversize_percent, ".0f") + "%") : "No"),
    kv("Gas Type", p.gas_type),
    kv("Altitude above 3,000 feet or atmospheric pressure below 13 psi", p.high_altitude ? "Yes" : "No")
  ];
  if (p.high_altitude) summary.push(kv("Atmospheric Pressure (psi)", $format(Patm, ".1f")));
  out.summary = summary;

  return out;
}
