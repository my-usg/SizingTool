// ============================================================================
//  Wrapper around the transpiled Model 046 algorithm.
//
//  Everything the Streamlit front end used to do around
//  run_regulator_selection046(): unit conversion, validation, oversize maths,
//  the capacity tables and result formatting.
//
//  This file is hand-written, NOT generated. Its Python twin is reference.py
//  in this same folder, and CI proves the two agree on every input it tests,
//  so this cannot silently drift from the algorithm's expectations.
//
//  build/build.py exposes this as USGSizing.sizeModel046(input), per the
//  "method" field in tool.json.
// ============================================================================

var PIPE_OPTIONS = ["N/A", '3/4"', '1"', '1-1/4"'];
var INLET_UNITS = ["psi", "bar", "kPa"];
var OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"];
var FLOW_UNITS = ["CFH", "CMH", "BTUH"];
var GAS_TYPES = ["Natural Gas", "Propane", "Other"];

// The 046 tabulates two different regulator families, identified by the
// register prefix in the algorithm's result map.
var IRV_BODIES = [
  ['Model 046-2, 3/4" Body', 'R046234'],
  ['Model 046-2, 1" Body', 'R046210'],
  ['Model 046-2, 1-1/4" Body', 'R04621Q']
];
var MONITOR_BODIES = [
  ['Model 046, 046-M or 046-2M, 3/4" Body', 'R046134'],
  ['Model 046, 046-M or 046-2M, 1" Body', 'R046110'],
  ['Model 046, 046-M or 046-2M, 1-1/4" Body', 'R04611Q']
];

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
    flow: 0, flow_units: "CFH",
    maop: 0,
    pipe_size: "N/A",
    opp_required: false, opp_pref: "IRV", irv_pressure: 2.0, partial_irv: false,
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

// One capacity table from a result map, or null when no register matches.
function buildTable(title, prefix, tableOpp, result) {
  var isIrv = (tableOpp === "IRV");
  var rows = [];
  result.forEach(function (capacity, reg) {
    if (String(reg).indexOf(prefix) !== 0) return;
    var orifice = orifice_type046(reg);
    var capStr = (typeof capacity === 'number') ? $format(capacity, ',.0f') : String(capacity);
    var works = will_work(capacity, reg, orifice_max046(reg));
    if (isIrv) {
      rows.push([orifice, capStr, works, will_irv_work046(reg, tableOpp)]);
    } else {
      rows.push([orifice, capStr, works]);
    }
  });
  if (!rows.length) return null;   // Streamlit skipped empty frames
  return {
    title: title,
    headers: isIrv
      ? ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work", "Will IRV Work"]
      : ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work"],
    rows: rows
  };
}

function sizeTool(rawInput) {
  var p = defaulted(rawInput);

  // Match the widget types of the original tool: pressures are floats,
  // flow and MAIP are whole numbers.
  var inlet_input = Number(p.inlet);
  var outlet_input = Number(p.outlet);
  var flow_rate = Math.trunc(Number(p.flow));
  var maop = Math.trunc(Number(p.maop));

  var pipesize_raw = p.pipe_size;
  var pipesize_input = (pipesize_raw === "N/A") ? 0 : pipesize_raw;

  // ---- overpressure protection ----
  var irv_input = 0.0;
  var opp_type = "None";
  var opp_pref = "";
  if (p.opp_required) {
    opp_pref = p.opp_pref;
    if (opp_pref === "IRV") {
      irv_input = Number(p.irv_pressure);
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
  if (inlet_psi > 0 && (inlet_psi > 1000 || inlet_psi < 10)) {
    errors.push("Inlet pressure must be between 10 and 1,000 psi.");
  }
  if (outlet_psi > 0 && (outlet_psi < 3 || outlet_psi > 200)) {
    errors.push("Outlet pressure must be between 3 and 200 psi.");
  }
  if (inlet_psi > 0 && outlet_psi > 0 && outlet_psi >= inlet_psi) {
    errors.push("Outlet pressure must be less than inlet pressure.");
  }
  if (Math.trunc(maop) !== 0 && maop < inlet_psi) errors.push("MAIP must be >= inlet pressure.");
  if (inlet_psi === 0) errors.push("Inlet pressure is required.");
  if (outlet_psi === 0) errors.push("Outlet pressure is required.");
  if (flow_rate === 0) errors.push("Please enter a gas load / flow rate.");

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
  var maop_psi = (maop === 0) ? inlet_psi : maop;

  if (p.flow_units === "CMH") {
    flow_cfh = flow_cfh * 35.3147;
  } else if (p.flow_units === "BTUH") {
    if (p.gas_type === "Natural Gas") {
      flow_cfh = flow_cfh / 1000;
    } else if (p.gas_type === "Propane") {
      flow_cfh = flow_cfh / 2516;
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
    maop: maop_psi,
    pipesize_input: pipesize_input,
    opp_type: opp_type,
    irv_input: irv_input,
    oversizeby: oversizeby,
    oversize_percent: oversize_percent,
    gastypemult: gastypemult,
    pload: pload,
    Patm: Patm
  });

  var r, result_irv, result_mon;
  try {
    r = run_regulator_selection046(inlet_psi, outlet_psi, opp_type);

    // For IRV sizing the Streamlit app tabulated both families, recomputing
    // each with its own monitor flag rather than reusing the selection run.
    if (opp_type === "IRV") {
      result_irv = interpolate_capacity(data046, inlet_psi, outlet_psi, false, false);
      result_mon = interpolate_capacity(data046, inlet_psi, outlet_psi, true, false);
    } else {
      result_irv = r[0];
      result_mon = r[0];
    }
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 046 sizing algorithm error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  var result = r[0], match = r[1], apply = r[2], warning = r[3];

  var warnings = $truthy(warning) ? [warning] : [];

  if (!$truthy(apply) && (result === null || result === undefined)) {
    return {
      ok: true,
      selected: false,
      errors: [],
      warnings: warnings,
      message: "Model 046 will not work for this application.",
      stopped: true
    };
  }

  function mget(key) {
    return (match instanceof Map) ? match.get(key) : (match ? match[key] : null);
  }

  var out = {
    ok: true,
    selected: !!$truthy(apply),
    errors: [],
    warnings: warnings,
    message: $truthy(apply) ? "Regulator selected!" : "Model 046 will not work for this application."
  };

  if ($truthy(apply)) {
    var monSpring = null;
    if ($truthy(mget('mon_color'))) {
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
    var pn = hsc_pnc046(match);
    var pnList = Array.isArray(pn) ? pn : [pn];
    for (var q = 0; q < pnList.length; q++) if ($truthy(pnList[q])) pns.push(pnList[q]);
    out.part_numbers = pns;
  }

  // ---- capacity tables, grouped into labelled sections ----
  // Guarded like the selection run: will_irv_work046() can fault on spring
  // colours missing from its IRV map (see README, "Known algorithm defect"),
  // and that must produce a readable message rather than a broken page.
  try {
    // IRV sizing shows both families; everything else shows one.
    var sections = [];
    function addSection(label, bodies, tableOpp, resultMap) {
      var tables = [];
      for (var b = 0; b < bodies.length; b++) {
        var t = buildTable(bodies[b][0], bodies[b][1], tableOpp, resultMap);
        if (t) tables.push(t);
      }
      if (tables.length) sections.push({ label: label, tables: tables });
    }

    if (opp_type === "IRV") {
      addSection("With IRV", IRV_BODIES, "IRV", result_irv);
      addSection("With Monitor", MONITOR_BODIES, "Monitor", result_mon);
    } else if (opp_type === "Partial") {
      addSection("With Partial IRV", IRV_BODIES, "Partial", result);
    } else if (opp_type === "Monitor") {
      addSection("With Monitor", MONITOR_BODIES, "Monitor", result);
    } else {
      // No protection: one unlabelled group, as in the original.
      addSection(null, MONITOR_BODIES, opp_type, result);
    }
    out.sections = sections;
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 046 table build error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  // ---- sizing adjustments ----
  var adjustments = [kv("Oversized By", $format(oversize_percent, ".0f") + "%")];
  if ($truthy(apply) && mget('opp') === "Monitor") adjustments.push(kv("Monitor Capacity Reduction", "30%"));
  if (gastypemult !== 1) adjustments.push(kv("Gas Type Factor", $format(gastypemult, ".4f")));
  if (Patm < 14.4) adjustments.push(kv("Elevation capacity reduction", $format(elevation_reduction, ".0f") + "%"));
  out.adjustments = adjustments;

  // ---- input summary (drives the PDF; same keys and order as the original) ----
  var summary = [
    kv("Inlet Pressure (" + p.inlet_units + ")", pyFloatStr(inlet_input)),
    kv("Outlet Pressure (" + p.outlet_units + ")", pyFloatStr(outlet_input)),
    kv("Max Flow Rate (" + p.flow_units + ")", $format(flow_rate, ',')),
    kv("Max Allowable Inlet Pressure (psi)", String(Math.trunc(maop))),
    kv("Requested Pipe Size", pipesize_raw),
    kv("Overpressure Protection Required", p.opp_required ? "Yes" : "No")
  ];
  if (!p.opp_required) {
    summary.push(kv("Select Regulator with IRV", opp_type === "Partial" ? "Yes" : "No"));
  } else {
    summary.push(kv("Protection Type", opp_pref === "IRV" ? "IRV" : "Monitor"));
    if (opp_pref === "IRV") {
      summary.push(kv("IRV Protect Downstream Pressure To (psi)", $format(irv_input, ".1f")));
    }
  }
  summary.push(kv("Percent Load Feeding High-Efficiency Appliance", p.high_efficiency ? (pload_pct + "%") : "0"));
  summary.push(kv("Override percentage regulator is oversized by",
    p.override_oversize ? ($format(oversize_percent, ".0f") + "%") : "No"));
  summary.push(kv("Gas Type", p.gas_type));
  // Only meaningful for "Other" - the factor is derived from it, so the PDF
  // should record what was entered.
  if (p.gas_type === "Other") {
    summary.push(kv("Specific Gravity", $format(p.specific_gravity, ".2f")));
  }
  summary.push(kv("Altitude above 3,000 feet or atmospheric pressure below 13 psi", p.high_altitude ? "Yes" : "No"));
  if (p.high_altitude) summary.push(kv("Atmospheric Pressure (psi)", $format(Patm, ".1f")));
  out.summary = summary;

  return out;
}
