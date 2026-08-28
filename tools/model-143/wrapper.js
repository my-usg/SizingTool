// ============================================================================
//  Wrapper around the transpiled Model 143 algorithm.
//
//  Everything the Streamlit front end used to do around
//  run_regulator_selection143(): unit conversion, validation, oversize maths,
//  the three capacity tables and result formatting.
//
//  This file is hand-written, NOT generated. Its Python twin is reference.py
//  in this same folder, and CI proves the two agree on every input it tests,
//  so this cannot silently drift from the algorithm's expectations.
//
//  build/build.py exposes this as USGSizing.sizeModel143(input), per the
//  "method" field in tool.json.
// ============================================================================

var PIPE_OPTIONS = ["N/A", '3/4"', '1"', '1-1/4"'];
var INLET_UNITS = ["psi", "bar", "kPa"];
var OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"];
var FLOW_UNITS = ["CFH", "CMH", "BTUH"];
var GAS_TYPES = ["Natural Gas", "Propane", "Other"];

// The three body sizes, and the register prefix that identifies each in the
// algorithm's result map.
var BODY_SIZES = [
  ['Model 143, 3/4" Body', 'R14334'],
  ['Model 143, 1" Body', 'R14310'],
  ['Model 143, 1-1/4" Body', 'R1431Q']
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
    opp_required: false, irv_pressure: 2.0, partial_irv: false,
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
  // The 143 only offers an internal relief valve, so "Yes" means IRV directly;
  // there is no monitor option to choose between.
  var irv_input = 0.0;
  var opp_type = "None";
  if (p.opp_required) {
    irv_input = Number(p.irv_pressure);
    opp_type = "IRV";
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
  if (inlet_psi > 0 && (inlet_psi > 125 || inlet_psi < 0.5)) {
    errors.push("Inlet pressure must be between 0.5 and 125 psi.");
  }
  if (outlet_psi > 0 && (outlet_psi < 3.5 / 28 || outlet_psi > 6)) {
    errors.push("Outlet pressure must be between 3.5\" wc and 6 psi.");
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
    Patm: Patm,
    result143: new Map()
  });

  var r;
  try {
    r = run_regulator_selection143(inlet_psi, outlet_psi, opp_type);
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 143 sizing algorithm error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  var result = r[0], match = r[1], apply = r[2], warning = r[3];

  // The tables read the algorithm's result map, so publish it back the way the
  // Streamlit app did before building them.
  $setGlobal('result143', result);

  var warnings = $truthy(warning) ? [warning] : [];

  // No result map at all means the algorithm stopped early; there is nothing
  // to tabulate, so report and return.
  if (!$truthy(apply) && (result === null || result === undefined)) {
    return {
      ok: true,
      selected: false,
      errors: [],
      warnings: warnings,
      message: "Model 143 will not work for this application.",
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
    message: $truthy(apply) ? "Regulator selected!" : "Model 143 will not work for this application."
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

    // hsc_pnc* now return a dict: worker, an optional monitor, and an optional
    // control line kit with its quantity. Transpiled Python dicts are JS Maps.
    var pn = hsc_pnc143(match);
    function pnField(key) {
      if (pn instanceof Map) return pn.get(key);
      return pn ? pn[key] : null;
    }
    var pns = [];
    if ($truthy(pnField('worker'))) pns.push(pnField('worker'));
    if ($truthy(pnField('monitor'))) pns.push(pnField('monitor'));
    out.part_numbers = pns;

    // The control line kit is a real SKU with its own quantity. It goes in the
    // cart and on the page, but not in the PDF.
    out.control_line = $truthy(pnField('controlline')) ? pnField('controlline') : null;
    var clq = pnField('controllineqty');
    out.control_line_qty = (clq === undefined) ? null : clq;
  }

  // ---- the three capacity tables (mirrors build_table in the Streamlit app) ----
  // Guarded like the selection run: a spring or orifice lookup can fault on a
  // value outside its table, and that must produce a readable message rather
  // than a broken page.
  try {
    var isIrv = (opp_type === "IRV");
    var columns = isIrv
      ? ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work", "Will IRV Work"]
      : ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work"];

    var tables = [];
    for (var b = 0; b < BODY_SIZES.length; b++) {
      var title = BODY_SIZES[b][0], prefix = BODY_SIZES[b][1];
      var rows = [];
      result.forEach(function (capacity, reg) {
        if (String(reg).indexOf(prefix) !== 0) return;
        var orifice = orifice_type143(reg);
        var capStr = (typeof capacity === 'number') ? $format(capacity, ',.0f') : String(capacity);
        var works = will_work(capacity, reg, orifice_max143(reg));
        if (isIrv) {
          rows.push([orifice, capStr, works, will_irv_work143(reg, opp_type)]);
        } else {
          rows.push([orifice, capStr, works]);
        }
      });
      // Streamlit skipped empty frames; do the same.
      if (rows.length) tables.push({ title: title, headers: columns, rows: rows });
    }
    out.tables = tables;
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 143 table build error', err, rawInput);
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
  if (p.opp_required) {
    summary.push(kv("IRV Protect Downstream Pressure To (psi)", $format(irv_input, ".1f")));
  } else {
    summary.push(kv("Select Regulator with IRV", opp_type === "Partial" ? "Yes" : "No"));
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
