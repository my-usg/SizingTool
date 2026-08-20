// ============================================================================
//  Wrapper around the transpiled algorithm.
//
//  Everything the Streamlit front end used to do around allmodels_selector():
//  unit conversion, validation, oversize maths and result formatting.
//
//  This file is hand-written, NOT generated. Its Python twin lives at
//  tools/sizing_reference.py and CI proves the two agree on every input it
//  tests, so this cannot silently drift from the algorithm's expectations.
//
//  Exposed as window.USGSizing.sizeAllModels(input) -> result object.
// ============================================================================

var PIPE_OPTIONS = ["N/A", '3/8"', '1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"'];
var INLET_UNITS = ["psi", "bar", "kPa"];
var OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"];
var FLOW_UNITS = ["CFH", "CMH", "BTUH"];
var GAS_TYPES = ["Natural Gas", "Propane", "Other"];

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

function defaulted(input) {
  var d = {
    inlet: 0, inlet_units: "psi",
    outlet: 0, outlet_units: "psi",
    flow: 0, min_flow: 0, flow_units: "CFH",
    maop: 0,
    pipe_size: "N/A",
    opp_required: false, opp_pref: "IRV", irv_pressure: 2.0, partial_irv: false,
    high_efficiency: false, high_efficiency_pct: 100,
    override_oversize: false, oversize_pct: 25,
    prefer_combustion: false,
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

function sizeAllModels(rawInput) {
  var p = defaulted(rawInput);

  // Match the widget types of the original tool: pressures are floats,
  // flows and MAIP are whole numbers.
  var inlet_input = Number(p.inlet);
  var outlet_input = Number(p.outlet);
  var flow_rate = Math.trunc(Number(p.flow));
  var min_flow_raw = Math.trunc(Number(p.min_flow));
  var maop = Math.trunc(Number(p.maop));

  var min_flow = (min_flow_raw === 0) ? flow_rate : min_flow_raw;

  var pipesize_raw = p.pipe_size;
  var pipesize_input = (pipesize_raw === "N/A") ? 0 : pipesize_raw;

  // ---- overpressure protection ----
  var irv_input = 0.0;
  var opp_type = "None";
  var opp_pref = "";
  if (p.opp_required) {
    opp_pref = p.opp_pref;
    if (opp_pref === "IRV") {
      irv_input = p.irv_pressure;
      opp_type = "IRV";
    } else {
      opp_type = "Monitor";
    }
  } else if (p.partial_irv) {
    opp_type = "Partial";
  }

  // ---- oversizing ----
  var pload = 0.0;
  var pload_pct = 0;
  if (p.high_efficiency) {
    pload_pct = p.high_efficiency_pct;
    pload = pload_pct / 100.0;
  }
  var oversizeby = 1.25 + (0.75 * pload);
  if (p.override_oversize) {
    oversizeby = 1 + (p.oversize_pct / 100);
  }
  var oversize_percent = (oversizeby - 1) * 100;

  var combust_pref = !!p.prefer_combustion;

  // ---- gas type ----
  var gastypemult = 1.0;
  if (p.gas_type === "Propane") {
    gastypemult = 0.63;
  } else if (p.gas_type === "Other") {
    gastypemult = Math.min(1.0, Math.pow(0.6 / p.specific_gravity, 0.5));
  }

  var Patm = p.high_altitude ? p.atmospheric_pressure : 14.4;

  var inlet_psi = toPsi(inlet_input, p.inlet_units);
  var outlet_psi = toPsi(outlet_input, p.outlet_units);

  // ---- elevation capacity reduction ----
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

  // ---- validation (same rules, wording and order as the original tool) ----
  var errors = [];
  if (inlet_psi === 0) errors.push("Inlet pressure is required.");
  if (outlet_psi === 0) errors.push("Outlet pressure is required.");
  if (flow_rate === 0) errors.push("Please enter a max gas load / flow rate.");
  if (inlet_psi > 0 && (inlet_psi > 1000 || inlet_psi < 0.25)) {
    errors.push("Inlet pressure must be between 7\" wc (0.25 psi / 0.017 bar) and 1,000 psi.");
  }
  if (outlet_psi > 0 && (outlet_psi < 1.5 / 28 || outlet_psi > 250)) {
    errors.push("Outlet pressure must be between 1.5\" wc and 250 psi.");
  }
  if (inlet_psi > 0 && outlet_psi > 0 && outlet_psi >= inlet_psi) {
    errors.push("Outlet pressure must be less than inlet pressure.");
  }
  if (Math.trunc(maop) !== 0 && maop < inlet_psi) errors.push("MAIP must be >= inlet pressure.");
  if (min_flow > flow_rate) errors.push("Minimum flow must be \u2264 maximum flow rate.");
  if (inlet_psi > 0 && outlet_psi > 0 && inlet_psi > 175 && outlet_psi < 3) {
    errors.push("Pressure differential too large \u2014 consider two pressure cuts.");
  }

  if (errors.length) return { ok: false, errors: errors };

  // ---- flow unit conversion ----
  var flow_cfh = flow_rate;
  var minflow_cfh = min_flow;
  var maop_psi = (maop === 0) ? inlet_psi : maop;

  if (p.flow_units === "CMH") {
    flow_cfh = flow_cfh * 35.3147;
    minflow_cfh = minflow_cfh * 35.3147;
  } else if (p.flow_units === "BTUH") {
    if (p.gas_type === "Natural Gas") {
      flow_cfh = flow_cfh / 1000;
      minflow_cfh = minflow_cfh / 1000;
    } else if (p.gas_type === "Propane") {
      flow_cfh = flow_cfh / 2516;
      minflow_cfh = minflow_cfh / 2516;
    } else {
      return {
        ok: false,
        errors: ["BTUH conversion is only supported for Natural Gas or Propane. Please enter flow rate in CFH or CMH."]
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
    min_flow: minflow_cfh,
    maop: maop_psi,
    pipesize_input: pipesize_input,
    opp_type: opp_type,
    irv_input: irv_input,
    oversizeby: oversizeby,
    gastypemult: gastypemult,
    pload: pload,
    combust_pref: combust_pref,
    Patm: Patm
  });

  var r;
  try {
    r = allmodels_selector(inlet_psi, outlet_psi, opp_type);
  } catch (err) {
    // Known defect carried over from the original script: monitor sizing with
    // an outlet between 85 and 100 psi runs past the top of the 57S spring
    // table. See README. Fail readably instead of throwing at the page.
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG sizing algorithm error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  var match = r[0], model_selection = r[1], warning = r[2], part_number = r[3], pipe_requirement = r[4];

  var warnings = $truthy(warning) ? [warning] : [];

  if (!$truthy(model_selection)) {
    return {
      ok: true,
      selected: false,
      errors: [],
      warnings: warnings,
      message: "No USG regulators will work for this application."
    };
  }

  function mget(key) {
    return (match instanceof Map) ? match.get(key) : match[key];
  }

  var monSpring = null;
  var monColor = mget('mon_color');
  if (monColor !== null && monColor !== undefined && monColor !== "N/A") {
    monSpring = (String(monColor) + ' ' + String(mget('mon_range') === null || mget('mon_range') === undefined ? '' : mget('mon_range'))).trim();
  }
  var monDiap = mget('mon_diap');
  if (monDiap === null || monDiap === undefined || monDiap === "N/A") monDiap = null;

  var springColor = mget('color') === null || mget('color') === undefined ? '' : mget('color');
  var springRange = mget('range') === null || mget('range') === undefined ? '' : mget('range');

  var rawFields = [
    ["Model", mget('model')],
    ["Diaphragm Size", mget('diap')],
    ["Body Size", mget('body')],
    ["Orifice Size", mget('orifice')],
    ["Seat", mget('seat')],
    ["Spring", (String(springColor) + ' ' + String(springRange)).trim()],
    ["Monitor Spring", monSpring],
    ["Monitor Diaphragm", monDiap]
  ];
  var selection = [];
  for (var f = 0; f < rawFields.length; f++) {
    if ($truthy(rawFields[f][1])) selection.push(kv(rawFields[f][0], rawFields[f][1]));
  }

  var cap = mget('capacity');
  var capacity = null;
  if ($truthy(cap) && cap !== "N/A") {
    var capNum = parseFloat(cap);
    capacity = isNaN(capNum) ? String(cap) : $format($round(capNum), ',');
  }

  var pns = [];
  var pnList = Array.isArray(part_number) ? part_number : [part_number];
  for (var q = 0; q < pnList.length; q++) if ($truthy(pnList[q])) pns.push(pnList[q]);

  // ---- sizing adjustments ----
  var adjustments = [kv("Oversized By", $format(oversize_percent, ".0f") + "%")];
  if (mget('opp') === "Monitor") adjustments.push(kv("Monitor Capacity Reduction", "30%"));
  if (gastypemult !== 1) adjustments.push(kv("Gas Type Factor", $format(gastypemult, ".4f")));
  if (Patm < 14.4) adjustments.push(kv("Elevation capacity reduction", $format(elevation_reduction, ".0f") + "%"));

  // ---- input summary (drives the PDF; same keys and order as the original) ----
  var summary = [
    kv("Inlet Pressure (" + p.inlet_units + ")", pyFloatStr(inlet_input)),
    kv("Outlet Pressure (" + p.outlet_units + ")", pyFloatStr(outlet_input)),
    kv("Max Flow Rate (" + p.flow_units + ")", $format(flow_rate, ',')),
    kv("Min Flow Rate (" + p.flow_units + ")", $format(min_flow, ',')),
    kv("Max Allowable Inlet Pressure (psi)", String(Math.trunc(maop))),
    kv("Requested Pipe Size", pipesize_raw),
    kv("Overpressure Protection Required", p.opp_required ? "Yes" : "No")
  ];
  if (!p.opp_required) {
    summary.push(kv("Select Regulator with IRV", opp_type === "Partial" ? "Yes" : "No"));
  } else {
    summary.push(kv("Protection Type", opp_pref));
    if (opp_pref === "IRV") {
      summary.push(kv("IRV Protect Downstream Pressure To (psi)", $format(irv_input, ".1f")));
    }
  }
  summary.push(kv("Percent Load Feeding High-Efficiency Appliance", p.high_efficiency ? (pload_pct + "%") : "0"));
  summary.push(kv("Override percentage regulator is oversized by",
    p.override_oversize ? ($format(oversize_percent, ".0f") + "%") : "No"));
  summary.push(kv("Combustion Regulator Preferred", combust_pref ? "Yes" : "No"));
  summary.push(kv("Gas Type", p.gas_type));
  summary.push(kv("Altitude above 3,000 feet or atmospheric pressure below 13 psi", p.high_altitude ? "Yes" : "No"));
  if (p.high_altitude) summary.push(kv("Atmospheric Pressure (psi)", $format(Patm, ".1f")));

  return {
    ok: true,
    selected: true,
    errors: [],
    warnings: warnings,
    message: "Regulator selected!",
    selection: selection,
    capacity: capacity,
    part_numbers: pns,
    pipe_note: $truthy(pipe_requirement) ? pipe_requirement : null,
    adjustments: adjustments,
    summary: summary
  };
}
