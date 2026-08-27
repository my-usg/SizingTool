/*!
 * Model 121/122 Sizing Tool
 * Holland Supply Company
 *
 * GENERATED FILE - DO NOT EDIT.
 * Built from tools/model-121/algorithm.py by build/build.py.
 * Edit the Python, push, and CI regenerates this file.
 *
 * tool:      model-121
 * version:   1.1.0
 * algorithm: sha256:d49c25cc8331
 * sources:   sha256:33b74c21d999
 *
 * Adds to the shared namespace:
 *   USGSizing.sizeModel121(input)  -> result object
 *   USGSizing.versions['model-121']      -> build metadata
 */
(function (root) {
  'use strict';


// ---- Python-semantics runtime helpers ----
function $truthy(x) {
  if (x === null || x === undefined || x === false) return false;
  if (x === true) return true;
  if (typeof x === 'number') return x !== 0;
  if (typeof x === 'string') return x.length > 0;
  if (Array.isArray(x)) return x.length > 0;
  if (x instanceof Map) return x.size > 0;
  return true;
}
function $add(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
  return a + b;
}
function $eq(a, b) {
  if (a === null || b === null) return a === b;
  return a === b;
}
function $iter(x) {
  if (Array.isArray(x)) return x;
  if (x instanceof Map) return Array.from(x.keys());
  if (typeof x === 'string') return x.split('');
  throw new Error('not iterable');
}
function $keys(d) { return Array.from(d.keys()); }
function $values(d) { return Array.from(d.values()); }
function $items(d) { return Array.from(d.entries()); }
function $list(x) { return $iter(x).slice(); }
function $len(x) { if (x instanceof Map) return x.size; return x.length; }
function $pyType(v) {
  if (v === null || v === undefined) return 'NoneType';
  if (typeof v === 'string') return 'str';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (Array.isArray(v)) return 'list';
  if (v instanceof Map) return 'dict';
  return typeof v;
}
function $index(o, x) {
  // Python's list.index()/str.index(): returns the first position, and RAISES
  // ValueError when absent - it does not return -1 like indexOf. Getting that
  // wrong would let a "not found" flow onward as a valid index of -1.
  if (typeof o === 'string') {
    var si = o.indexOf(x);
    if (si === -1) throw new Error('ValueError: substring not found');
    return si;
  }
  if (Array.isArray(o)) {
    for (var i = 0; i < o.length; i++) {
      if ($eq(o[i], x)) return i;
    }
    throw new Error('ValueError: ' + $str(x) + ' is not in list');
  }
  throw new TypeError("argument of type '" + $pyType(o) + "' is not iterable");
}
function $get(o, k) {
  if (o instanceof Map) {
    if (!o.has(k)) throw new Error('KeyError: ' + k);
    return o.get(k);
  }
  if (Array.isArray(o) || typeof o === 'string') {
    // Python raises on a non-integer index. JavaScript would quietly return
    // undefined (e.g. 'N/A'['color']), which lets a wrong value flow onward
    // into a part number instead of failing. Raise the same error Python does.
    if (typeof k !== 'number' || !Number.isInteger(k)) {
      throw new TypeError(typeof o === 'string'
        ? "string indices must be integers, not '" + $pyType(k) + "'"
        : 'list indices must be integers or slices, not ' + $pyType(k));
    }
    let i = k; if (i < 0) i += o.length;
    if (i < 0 || i >= o.length) throw new Error('IndexError');
    return o[i];
  }
  if (o === null || o === undefined) {
    throw new TypeError("'NoneType' object is not subscriptable");
  }
  throw new Error('subscript on ' + typeof o);
}
function $set(o, k, v) {
  if (o instanceof Map) { o.set(k, v); return; }
  if (Array.isArray(o)) { let i = k; if (i < 0) i += o.length; o[i] = v; return; }
  throw new Error('setitem');
}
function $dget(d, k, def) { return d.has(k) ? d.get(k) : def; }
function $in(k, c) {
  if (c instanceof Map) return c.has(k);
  if (Array.isArray(c)) return c.some(x => $eq(x, k));
  if (typeof c === 'string') return c.indexOf(k) !== -1;
  throw new Error('in');
}
function $slice(o, lo, hi) {
  const n = o.length;
  let a = (lo === null) ? 0 : (lo < 0 ? Math.max(0, lo + n) : Math.min(lo, n));
  let b = (hi === null) ? n : (hi < 0 ? Math.max(0, hi + n) : Math.min(hi, n));
  if (b < a) b = a;
  return o.slice(a, b);
}
function $sorted(x) {
  const arr = $iter(x).slice();
  arr.sort((a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (a < b) return -1; if (a > b) return 1; return 0;
  });
  return arr;
}
function $max(x) { const a = $iter(x); if (!a.length) throw new Error('max() empty'); return a.reduce((m, v) => v > m ? v : m); }
function $min(x) { const a = $iter(x); if (!a.length) throw new Error('min() empty'); return a.reduce((m, v) => v < m ? v : m); }
function $any(x) { return $iter(x).some($truthy); }
function $all(x) { return $iter(x).every($truthy); }
function $join(sep, x) { return $iter(x).join(sep); }
function $fixedStr(x, p) {
  // Format like Python's format(x, '.Pf'): round the DOUBLE's exact decimal
  // value, using round-half-even only on an exact tie.
  //
  // Neither of the obvious approaches works on its own. toFixed() rounds ties
  // away from zero ((0.5).toFixed(0) === "1" but Python gives "0"), and
  // scaling by 10^p introduces float error (9.05 * 10 lands below 90.5, so
  // 9.05 would render as "9.0" where Python gives "9.1"). Reading the exact
  // expansion avoids both.
  if (!isFinite(x)) return String(x);
  if (Math.abs(x) >= 1e21) return x.toFixed(p);
  var neg = x < 0 || (x === 0 && 1 / x < 0);
  var s = Math.abs(x).toFixed(100); // exact for doubles in this range
  var dot = s.indexOf('.');
  var intPart = s.slice(0, dot);
  var frac = s.slice(dot + 1);
  var digits = intPart + frac.slice(0, p);
  var rest = frac.slice(p);
  var head = rest.charAt(0);
  var roundUp = false;
  if (head > '5') {
    roundUp = true;
  } else if (head === '5') {
    if (/[1-9]/.test(rest.slice(1))) {
      roundUp = true;                       // above the midpoint
    } else {
      roundUp = (parseInt(digits.charAt(digits.length - 1), 10) % 2) === 1;  // exact tie: half-even
    }
  }
  if (roundUp) {
    var arr = digits.split('');
    var i = arr.length - 1;
    while (i >= 0) {
      if (arr[i] === '9') { arr[i] = '0'; i--; }
      else { arr[i] = String(parseInt(arr[i], 10) + 1); break; }
    }
    if (i < 0) arr.unshift('1');
    digits = arr.join('');
  }
  var out;
  if (p === 0) {
    out = digits;
  } else {
    var cut = digits.length - p;
    out = digits.slice(0, cut) + '.' + digits.slice(cut);
  }
  out = out.replace(/^0+(?=\d)/, '');
  if (neg) out = '-' + out;   // Python keeps the sign, e.g. format(-0.5, '.0f') == '-0'
  return out;
}
function $round(x, nd) {
  // Python 3 round(): half-even on the double's exact value.
  if (nd === undefined) return parseInt($fixedStr(x, 0), 10);
  return parseFloat($fixedStr(x, nd));
}
function $str(x) {
  if (x === null) return 'None';
  if (x === true) return 'True';
  if (x === false) return 'False';
  return String(x);
}
function $format(x, spec) {
  // supports the specs used by the tool: '.0f', '.1f', '.2f', '.4f', ',', ',.0f'
  const mm = /^(,)?(?:\.(\d+)f)?$/.exec(spec);
  if (!mm) throw new Error('format spec ' + spec);
  const comma = !!mm[1];
  const prec = mm[2] === undefined ? null : parseInt(mm[2], 10);
  let v = x, s;
  if (prec !== null) {
    s = $fixedStr(v, prec);
  } else {
    s = $str(v);
  }
  if (comma) {
    const parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    s = parts.join('.');
  }
  return s;
}
// Mirrors the Streamlit runtime where these names are always injected into the exec'd namespace
var $GLOBALS = new Map([["inlet_input",1],["outlet_input",1],["flow_rate",1],["min_flow",1],["maop",1],["pipesize_input",1],["opp_type",1],["irv_input",1],["oversizeby",1],["oversize_percent",1],["gastypemult",1],["pload",1],["Patm",1]]);
var $printBuf = [];
function $print(args) { $printBuf.push(args.map($str).join(' ')); }

var Patm, flow_rate, gastypemult, hpdata121, inlet_input, irv_input, maop, min_flow, opp_type, outlet_input, oversize_percent, oversizeby, pipesize_input, pload, stddata121, stddata122;
stddata121 = new Map([[(1.5 / 28), new Map([[0.29, new Map([["R1210813", 1500], ["R121081Q", 2000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 4000], ["R1211220", 5000], ["R121122H", 5500], ["R1211230", null], ["R1211630", 10000]])], [0.5, new Map([["R1210813", 2500], ["R121081Q", 3500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 4900], ["R1211220", 8900], ["R121122H", 9700], ["R1211230", null], ["R1211630", 19500]])], [1, new Map([["R1210813", 4200], ["R121081Q", 5500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 7400], ["R1211220", 13000], ["R121122H", 14400], ["R1211230", null], ["R1211630", 31000]])], [2, new Map([["R1210813", 6100], ["R121081Q", 7800], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 11500], ["R1211220", 20500], ["R121122H", 22200], ["R1211230", null], ["R1211630", 47000]])], [3, new Map([["R1210813", 7700], ["R121081Q", 9700], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 14600], ["R1211220", 26300], ["R121122H", 29100], ["R1211230", null], ["R1211630", 60000]])], [5, new Map([["R1210813", 11200], ["R121081Q", 12700], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 19500], ["R1211220", 35000], ["R121122H", 39500], ["R1211230", null], ["R1211630", 80000]])], [10, new Map([["R1210813", 14500], ["R121081Q", 18000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 30000], ["R1211220", 52000], ["R121122H", 58000], ["R1211230", null], ["R1211630", 12500]])], [15, new Map([["R1210813", 17300], ["R121081Q", 22500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 37000], ["R1211220", 68000], ["R121122H", 75500], ["R1211230", null], ["R1211630", 14500]])], [25, new Map([["R1210813", 23200], ["R121081Q", 27100], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 50000], ["R1211220", 90000], ["R121122H", 100000], ["R1211230", null], ["R1211630", 190000]])], [40, new Map([["R1210813", 32000], ["R121081Q", 41000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 68000], ["R1211220", 125000], ["R121122H", 140000], ["R1211230", null], ["R1211630", 260000]])], [50, new Map([["R1210813", 38000], ["R121081Q", 48000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 80000], ["R1211220", 150000], ["R121122H", 166000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 44000], ["R121081Q", 56000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 95000], ["R1211220", 175000], ["R121122H", 195000], ["R1211230", null], ["R1211630", null]])]])], [0.18, new Map([[0.29, new Map([["R1210813", 1500], ["R121081Q", 2000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 4000], ["R1211220", 5000], ["R121122H", 5500], ["R1211230", null], ["R1211630", 10000]])], [0.5, new Map([["R1210813", 2500], ["R121081Q", 3500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 4900], ["R1211220", 8900], ["R121122H", 9700], ["R1211230", null], ["R1211630", 19500]])], [1, new Map([["R1210813", 4200], ["R121081Q", 5500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 7400], ["R1211220", 13000], ["R121122H", 14400], ["R1211230", null], ["R1211630", 31000]])], [2, new Map([["R1210813", 6100], ["R121081Q", 7800], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 11500], ["R1211220", 20500], ["R121122H", 22200], ["R1211230", null], ["R1211630", 47000]])], [3, new Map([["R1210813", 7700], ["R121081Q", 9700], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 14600], ["R1211220", 26300], ["R121122H", 29100], ["R1211230", null], ["R1211630", 60000]])], [5, new Map([["R1210813", 11200], ["R121081Q", 12700], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 19500], ["R1211220", 35000], ["R121122H", 39500], ["R1211230", null], ["R1211630", 80000]])], [10, new Map([["R1210813", 14500], ["R121081Q", 18000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 30000], ["R1211220", 52000], ["R121122H", 58000], ["R1211230", null], ["R1211630", 12500]])], [15, new Map([["R1210813", 17300], ["R121081Q", 22500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 37000], ["R1211220", 68000], ["R121122H", 75500], ["R1211230", null], ["R1211630", 14500]])], [25, new Map([["R1210813", 23200], ["R121081Q", 27100], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 50000], ["R1211220", 90000], ["R121122H", 100000], ["R1211230", null], ["R1211630", 190000]])], [40, new Map([["R1210813", 32000], ["R121081Q", 41000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 68000], ["R1211220", 125000], ["R121122H", 140000], ["R1211230", null], ["R1211630", 260000]])], [50, new Map([["R1210813", 38000], ["R121081Q", 48000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 80000], ["R1211220", 150000], ["R121122H", 166000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 44000], ["R121081Q", 56000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 95000], ["R1211220", 175000], ["R121122H", 195000], ["R1211230", null], ["R1211630", null]])]])], [0.25, new Map([[0.29, new Map([["R1210813", 1000], ["R121081Q", 1500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 3000], ["R1211220", 4000], ["R121122H", 4500], ["R1211230", null], ["R1211630", 9700]])], [0.5, new Map([["R1210813", 2300], ["R121081Q", 3000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 4500], ["R1211220", 8000], ["R121122H", 9000], ["R1211230", null], ["R1211630", 19000]])], [1, new Map([["R1210813", 4000], ["R121081Q", 5000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 7000], ["R1211220", 12500], ["R121122H", 14000], ["R1211230", null], ["R1211630", 30800]])], [2, new Map([["R1210813", 6000], ["R121081Q", 7500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 11000], ["R1211220", 20000], ["R121122H", 22000], ["R1211230", null], ["R1211630", 46000]])], [3, new Map([["R1210813", 7500], ["R121081Q", 9500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 14500], ["R1211220", 26000], ["R121122H", 29000], ["R1211230", null], ["R1211630", 59000]])], [5, new Map([["R1210813", 10000], ["R121081Q", 12500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 19400], ["R1211220", 35000], ["R121122H", 39500], ["R1211230", null], ["R1211630", 80000]])], [10, new Map([["R1210813", 14000], ["R121081Q", 17850], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 30000], ["R1211220", 52000], ["R121122H", 58000], ["R1211230", null], ["R1211630", 125000]])], [15, new Map([["R1210813", 17000], ["R121081Q", 22000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 37000], ["R1211220", 68000], ["R121122H", 75500], ["R1211230", null], ["R1211630", 145000]])], [25, new Map([["R1210813", 23000], ["R121081Q", 27000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 50000], ["R1211220", 90000], ["R121122H", 100000], ["R1211230", null], ["R1211630", 190000]])], [40, new Map([["R1210813", 32000], ["R121081Q", 41000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 68000], ["R1211220", 125000], ["R121122H", 140000], ["R1211230", null], ["R1211630", 260000]])], [50, new Map([["R1210813", 38000], ["R121081Q", 48000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 80000], ["R1211220", 150000], ["R121122H", 166000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 44000], ["R121081Q", 56000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 95000], ["R1211220", 175000], ["R121122H", 195000], ["R1211230", null], ["R1211630", null]])]])], [0.39, new Map([[0.5, new Map([["R1210813", 2000], ["R121081Q", 2200], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 3700], ["R1211220", 6600], ["R121122H", 7300], ["R1211230", null], ["R1211630", 18000]])], [1, new Map([["R1210813", 3600], ["R121081Q", 4500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 6500], ["R1211220", 12000], ["R121122H", 13000], ["R1211230", null], ["R1211630", 29000]])], [2, new Map([["R1210813", 5500], ["R121081Q", 7000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 10300], ["R1211220", 19400], ["R121122H", 21000], ["R1211230", null], ["R1211630", 46000]])], [3, new Map([["R1210813", 7400], ["R121081Q", 9000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 13750], ["R1211220", 25000], ["R121122H", 27900], ["R1211230", null], ["R1211630", 58000]])], [5, new Map([["R1210813", 9900], ["R121081Q", 11200], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 18500], ["R1211220", 34500], ["R121122H", 38700], ["R1211230", null], ["R1211630", 78000]])], [10, new Map([["R1210813", 13700], ["R121081Q", 17000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 28000], ["R1211220", 51000], ["R121122H", 57000], ["R1211230", null], ["R1211630", 120000]])], [15, new Map([["R1210813", 16500], ["R121081Q", 21700], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 36200], ["R1211220", 67500], ["R121122H", 74000], ["R1211230", null], ["R1211630", 145000]])], [25, new Map([["R1210813", 22700], ["R121081Q", 26200], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 49000], ["R1211220", 89000], ["R121122H", 99000], ["R1211230", null], ["R1211630", 190000]])], [40, new Map([["R1210813", 31200], ["R121081Q", 40000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 67100], ["R1211220", 124000], ["R121122H", 138000], ["R1211230", null], ["R1211630", 260000]])], [50, new Map([["R1210813", 37700], ["R121081Q", 45000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 79000], ["R1211220", 148000], ["R121122H", 164000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 43300], ["R121081Q", 55000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 93500], ["R1211220", 174000], ["R121122H", 193000], ["R1211230", null], ["R1211630", null]])]])], [0.64, new Map([[1, new Map([["R1210813", 2500], ["R121081Q", 4000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 6000], ["R1211220", 11000], ["R121122H", 12000], ["R1211230", null], ["R1211630", 27000]])], [2, new Map([["R1210813", 5000], ["R121081Q", 6000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 9500], ["R1211220", 17500], ["R121122H", 19100], ["R1211230", null], ["R1211630", 34000]])], [3, new Map([["R1210813", 7200], ["R121081Q", 8000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 12500], ["R1211220", 23400], ["R121122H", 26000], ["R1211230", null], ["R1211630", 53000]])], [5, new Map([["R1210813", 9700], ["R121081Q", 10400], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 17300], ["R1211220", 33500], ["R121122H", 37000], ["R1211230", null], ["R1211630", 74000]])], [10, new Map([["R1210813", 13000], ["R121081Q", 16000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 27000], ["R1211220", 49600], ["R121122H", 54800], ["R1211230", null], ["R1211630", 120000]])], [15, new Map([["R1210813", 15800], ["R121081Q", 20500], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 35000], ["R1211220", 65500], ["R121122H", 71900], ["R1211230", null], ["R1211630", 138500]])], [25, new Map([["R1210813", 22000], ["R121081Q", 25400], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 47400], ["R1211220", 88000], ["R121122H", 97100], ["R1211230", null], ["R1211630", 185000]])], [40, new Map([["R1210813", 30000], ["R121081Q", 39000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 66000], ["R1211220", 120000], ["R121122H", 133500], ["R1211230", null], ["R1211630", 260000]])], [50, new Map([["R1210813", 37000], ["R121081Q", 43600], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 77700], ["R1211220", 145000], ["R121122H", 156000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 42500], ["R121081Q", 53000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 90000], ["R1211220", 171200], ["R121122H", 189700], ["R1211230", null], ["R1211630", null]])]])], [1, new Map([[2, new Map([["R1210813", 5200], ["R121081Q", 6200], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 10000], ["R1211220", 18000], ["R121122H", 20000], ["R1211230", 35000], ["R1211630", 35000]])], [3, new Map([["R1210813", 7300], ["R121081Q", 8400], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 13000], ["R1211220", 23800], ["R121122H", 27100], ["R1211230", 53000], ["R1211630", 55000]])], [5, new Map([["R1210813", 9800], ["R121081Q", 10800], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 18000], ["R1211220", 34000], ["R121122H", 37600], ["R1211230", 74000], ["R1211630", 75000]])], [10, new Map([["R1210813", 13500], ["R121081Q", 16300], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 27500], ["R1211220", 50000], ["R121122H", 55500], ["R1211230", 110000], ["R1211630", 125000]])], [15, new Map([["R1210813", 16000], ["R121081Q", 21000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 35700], ["R1211220", 66000], ["R121122H", 72300], ["R1211230", 139000], ["R1211630", 140000]])], [25, new Map([["R1210813", 22500], ["R121081Q", 25900], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 48000], ["R1211220", 88500], ["R121122H", 98000], ["R1211230", 185000], ["R1211630", 190000]])], [40, new Map([["R1210813", 31000], ["R121081Q", 39600], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 66600], ["R1211220", 121500], ["R121122H", 135000], ["R1211230", 100000], ["R1211630", 260000]])], [50, new Map([["R1210813", 38000], ["R121081Q", 44000], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 78000], ["R1211220", 146500], ["R121122H", 158000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 43000], ["R121081Q", 53800], ["R121081H", null], ["R1210820", null], ["R121082H", null], ["R121121H", 92000], ["R1211220", 172000], ["R121122H", 191000], ["R1211230", null], ["R1211630", null]])]])], [2, new Map([[3, new Map([["R1210813", 6000], ["R121081Q", 7200], ["R121081H", 8500], ["R1210820", 15000], ["R121082H", 16700], ["R121121H", 10000], ["R1211220", 19000], ["R121122H", 21500], ["R1211230", 40000], ["R1211630", null]])], [5, new Map([["R1210813", 9000], ["R121081Q", 9700], ["R121081H", 13000], ["R1210820", 24000], ["R121082H", 26700], ["R121121H", 16400], ["R1211220", 30000], ["R121122H", 33500], ["R1211230", 65000], ["R1211630", null]])], [10, new Map([["R1210813", 12200], ["R121081Q", 15400], ["R121081H", 21000], ["R1210820", 39000], ["R121082H", 43500], ["R121121H", 25100], ["R1211220", 49000], ["R121122H", 53000], ["R1211230", 100000], ["R1211630", null]])], [15, new Map([["R1210813", 15000], ["R121081Q", 18900], ["R121081H", 27000], ["R1210820", 50000], ["R121082H", 55000], ["R121121H", 34000], ["R1211220", 64700], ["R121122H", 70100], ["R1211230", 135000], ["R1211630", null]])], [25, new Map([["R1210813", 21400], ["R121081Q", 24900], ["R121081H", 36000], ["R1210820", 65000], ["R121082H", 72000], ["R121121H", 46000], ["R1211220", 84500], ["R121122H", 94000], ["R1211230", 183000], ["R1211630", null]])], [40, new Map([["R1210813", 30100], ["R121081Q", 38400], ["R121081H", 50000], ["R1210820", 90000], ["R121082H", 100000], ["R121121H", 64200], ["R1211220", 118000], ["R121122H", 130000], ["R1211230", 200000], ["R1211630", null]])], [50, new Map([["R1210813", 35500], ["R121081Q", 42000], ["R121081H", 66000], ["R1210820", 120000], ["R121082H", 133000], ["R121121H", 74900], ["R1211220", 143300], ["R121122H", 155000], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 42000], ["R121081Q", 52100], ["R121081H", 71500], ["R1210820", 130000], ["R121082H", 144000], ["R121121H", 87000], ["R1211220", 170000], ["R121122H", 188000], ["R1211230", null], ["R1211630", null]])]])], [3, new Map([[5, new Map([["R1210813", 7500], ["R121081Q", 8300], ["R121081H", 11000], ["R1210820", 20000], ["R121082H", 22000], ["R121121H", 14000], ["R1211220", 27500], ["R121122H", 27500], ["R1211230", 55000], ["R1211630", null]])], [10, new Map([["R1210813", 11500], ["R121081Q", 15000], ["R121081H", 20000], ["R1210820", 37000], ["R121082H", 41000], ["R121121H", 25500], ["R1211220", 46500], ["R121122H", 52000], ["R1211230", 90000], ["R1211630", null]])], [15, new Map([["R1210813", 14300], ["R121081Q", 18000], ["R121081H", 26000], ["R1210820", 48000], ["R121082H", 53500], ["R121121H", 31500], ["R1211220", 61500], ["R121122H", 66500], ["R1211230", 125000], ["R1211630", null]])], [25, new Map([["R1210813", 20000], ["R121081Q", 24000], ["R121081H", 35100], ["R1210820", 64000], ["R121082H", 71000], ["R121121H", 45500], ["R1211220", 87000], ["R121122H", 94000], ["R1211230", 175000], ["R1211630", null]])], [40, new Map([["R1210813", 29500], ["R121081Q", 38000], ["R121081H", 47000], ["R1210820", 85000], ["R121082H", 94500], ["R121121H", 63500], ["R1211220", 116500], ["R121122H", 129500], ["R1211230", 200000], ["R1211630", null]])], [50, new Map([["R1210813", 34500], ["R121081Q", 40800], ["R121081H", 63500], ["R1210820", 116000], ["R121082H", 129000], ["R121121H", 76000], ["R1211220", 139500], ["R121122H", 153500], ["R1211230", null], ["R1211630", null]])], [60, new Map([["R1210813", 40000], ["R121081Q", 51600], ["R121081H", 70000], ["R1210820", 127000], ["R121082H", 140000], ["R121121H", 86500], ["R1211220", 165500], ["R121122H", 179000], ["R1211230", null], ["R1211630", null]])]])]]);
stddata122 = new Map([[0.18, new Map([[0.29, new Map([["R1220810", 1550], ["R122081Q", 2000], ["R122121H", 4000], ["R1221220", 5000], ["R122122H", 5500]])], [0.5, new Map([["R1220810", 2500], ["R122081Q", 3500], ["R122121H", 4900], ["R1221220", 8800], ["R122122H", 9600]])], [1, new Map([["R1220810", 4200], ["R122081Q", 5000], ["R122121H", 6600], ["R1221220", 12200], ["R122122H", 13600]])], [2, new Map([["R1220810", 5700], ["R122081Q", 7300], ["R122121H", 10500], ["R1221220", 18200], ["R122122H", 20700]])], [3, new Map([["R1220810", 7300], ["R122081Q", 9000], ["R122121H", 12000], ["R1221220", 25000], ["R122122H", 27000]])], [5, new Map([["R1220810", 8000], ["R122081Q", 10000], ["R122121H", 14500], ["R1221220", 32000], ["R122122H", 35000]])], [10, new Map([["R1220810", 9000], ["R122081Q", 15000], ["R122121H", 16000], ["R1221220", 38000], ["R122122H", 42000]])], [15, new Map([["R1220810", 9000], ["R122081Q", 15000], ["R122121H", 18000], ["R1221220", 38000], ["R122122H", 48000]])]])], [0.25, new Map([[0.29, new Map([["R1220810", 1000], ["R122081Q", 1500], ["R122121H", 3000], ["R1221220", 4000], ["R122122H", 4500]])], [0.5, new Map([["R1220810", 2300], ["R122081Q", 3000], ["R122121H", 4500], ["R1221220", 8000], ["R122122H", 9000]])], [1, new Map([["R1220810", 4000], ["R122081Q", 4800], ["R122121H", 6500], ["R1221220", 12000], ["R122122H", 13400]])], [2, new Map([["R1220810", 5500], ["R122081Q", 7000], ["R122121H", 10000], ["R1221220", 18000], ["R122122H", 20000]])], [3, new Map([["R1220810", 7000], ["R122081Q", 8700], ["R122121H", 12000], ["R1221220", 25000], ["R122122H", 27000]])], [5, new Map([["R1220810", 8000], ["R122081Q", 9800], ["R122121H", 14500], ["R1221220", 32000], ["R122122H", 35000]])], [10, new Map([["R1220810", 9500], ["R122081Q", 15700], ["R122121H", 16000], ["R1221220", 38000], ["R122122H", 42000]])], [15, new Map([["R1220810", 9500], ["R122081Q", 15700], ["R122121H", 18000], ["R1221220", 38000], ["R122122H", 48000]])]])], [0.39, new Map([[0.5, new Map([["R1220810", 2000], ["R122081Q", 2200], ["R122121H", 3700], ["R1221220", 6600], ["R122122H", 7300]])], [1, new Map([["R1220810", 3600], ["R122081Q", 4000], ["R122121H", 6000], ["R1221220", 11500], ["R122122H", 12100]])], [2, new Map([["R1220810", 5300], ["R122081Q", 6400], ["R122121H", 9800], ["R1221220", 17300], ["R122122H", 19200]])], [3, new Map([["R1220810", 6000], ["R122081Q", 8000], ["R122121H", 11100], ["R1221220", 24000], ["R122122H", 26500]])], [5, new Map([["R1220810", 8400], ["R122081Q", 9500], ["R122121H", 13900], ["R1221220", 30000], ["R122122H", 32000]])], [10, new Map([["R1220810", 10000], ["R122081Q", 15200], ["R122121H", 15000], ["R1221220", 35000], ["R122122H", 39000]])], [15, new Map([["R1220810", 11000], ["R122081Q", 15800], ["R122121H", 19000], ["R1221220", 40000], ["R122122H", 48000]])]])], [0.64, new Map([[1, new Map([["R1220810", 2500], ["R122081Q", 3600], ["R122121H", 5750], ["R1221220", 10700], ["R122122H", 11300]])], [2, new Map([["R1220810", 4000], ["R122081Q", 5700], ["R122121H", 9000], ["R1221220", 16500], ["R122122H", 18200]])], [3, new Map([["R1220810", 4900], ["R122081Q", 6900], ["R122121H", 10000], ["R1221220", 22300], ["R122122H", 24900]])], [5, new Map([["R1220810", 7800], ["R122081Q", 8800], ["R122121H", 12000], ["R1221220", 28100], ["R122122H", 30200]])], [10, new Map([["R1220810", 9500], ["R122081Q", 14500], ["R122121H", 13500], ["R1221220", 32200], ["R122122H", 36000]])], [15, new Map([["R1220810", 11500], ["R122081Q", 15000], ["R122121H", 19000], ["R1221220", 39000], ["R122122H", 42000]])]])], [1, new Map([[2, new Map([["R1220810", 4500], ["R122081Q", 6000], ["R122121H", 9500], ["R1221220", 16900], ["R122122H", 18800]])], [3, new Map([["R1220810", 5200], ["R122081Q", 7200], ["R122121H", 10500], ["R1221220", 23000], ["R122122H", 25400]])], [5, new Map([["R1220810", 8000], ["R122081Q", 9100], ["R122121H", 12700], ["R1221220", 29000], ["R122122H", 31000]])], [10, new Map([["R1220810", 9700], ["R122081Q", 14900], ["R122121H", 14000], ["R1221220", 33000], ["R122122H", 37000]])], [15, new Map([["R1220810", 11500], ["R122081Q", 15000], ["R122121H", 20000], ["R1221220", 40000], ["R122122H", 45000]])]])], [2, new Map([[3, new Map([["R1220810", 4000], ["R122081Q", 6300], ["R122121H", 8900], ["R1221220", 18000], ["R122122H", 20000]])], [5, new Map([["R1220810", 7500], ["R122081Q", 8100], ["R122121H", 10000], ["R1221220", 27400], ["R122122H", 29000]])], [10, new Map([["R1220810", 9000], ["R122081Q", 13800], ["R122121H", 12700], ["R1221220", 30000], ["R122122H", 33000]])], [15, new Map([["R1220810", 11000], ["R122081Q", 14000], ["R122121H", 18000], ["R1221220", 36000], ["R122122H", 39900]])]])]]);
hpdata121 = new Map([[3, new Map([[5, new Map([["R121HP13", 7500], ["R121HP1Q", 8300], ["R121HP1H", 11000], ["R121HP20", 20000], ["R121HP2H", 22000]])], [10, new Map([["R121HP13", 11500], ["R121HP1Q", 15000], ["R121HP1H", 20000], ["R121HP20", 37000], ["R121HP2H", 41000]])], [15, new Map([["R121HP13", 14300], ["R121HP1Q", 18000], ["R121HP1H", 26000], ["R121HP20", 48000], ["R121HP2H", 53500]])], [25, new Map([["R121HP13", 20000], ["R121HP1Q", 24000], ["R121HP1H", 35100], ["R121HP20", 64000], ["R121HP2H", 71000]])], [40, new Map([["R121HP13", 29500], ["R121HP1Q", 38000], ["R121HP1H", 47000], ["R121HP20", 85000], ["R121HP2H", 94500]])], [50, new Map([["R121HP13", 34500], ["R121HP1Q", 40800], ["R121HP1H", 63500], ["R121HP20", 116000], ["R121HP2H", 129000]])], [60, new Map([["R121HP13", 40000], ["R121HP1Q", 51600], ["R121HP1H", 70000], ["R121HP20", 127000], ["R121HP2H", 140000]])]])], [5, new Map([[10, new Map([["R121HP13", 11000], ["R121HP1Q", 14200], ["R121HP1H", 16500], ["R121HP20", 30000], ["R121HP2H", 33500]])], [15, new Map([["R121HP13", 14000], ["R121HP1Q", 17300], ["R121HP1H", 24500], ["R121HP20", 45000], ["R121HP2H", 50000]])], [25, new Map([["R121HP13", 19200], ["R121HP1Q", 23100], ["R121HP1H", 33000], ["R121HP20", 60000], ["R121HP2H", 66500]])], [40, new Map([["R121HP13", 28000], ["R121HP1Q", 37200], ["R121HP1H", 44500], ["R121HP20", 80000], ["R121HP2H", 89000]])], [50, new Map([["R121HP13", 34000], ["R121HP1Q", 39800], ["R121HP1H", 62000], ["R121HP20", 114000], ["R121HP2H", 127000]])], [60, new Map([["R121HP13", 38500], ["R121HP1Q", 50000], ["R121HP1H", 68000], ["R121HP20", 123000], ["R121HP2H", 135000]])]])], [10, new Map([[15, new Map([["R121HP13", 10000], ["R121HP1Q", 14000], ["R121HP1H", 22000], ["R121HP20", 40000], ["R121HP2H", 44500]])], [25, new Map([["R121HP13", 17000], ["R121HP1Q", 20000], ["R121HP1H", 30000], ["R121HP20", 55000], ["R121HP2H", 61000]])], [40, new Map([["R121HP13", 24000], ["R121HP1Q", 34000], ["R121HP1H", 42700], ["R121HP20", 76000], ["R121HP2H", 85000]])], [50, new Map([["R121HP13", 30000], ["R121HP1Q", 37000], ["R121HP1H", 60500], ["R121HP20", 110000], ["R121HP2H", 122000]])], [60, new Map([["R121HP13", 35000], ["R121HP1Q", 45000], ["R121HP1H", 66500], ["R121HP20", 121000], ["R121HP2H", 130000]])]])]]);
function interpolate_capacity(data, inlet, outlet, monitor_used, vp) {
  let alt_adj, cap_high, cap_low, capacities, interpolated, outlet_high, outlet_low, outlet_vals, ratio, reg, t, v_high, v_low, $t1, $t5, $t6;
  outlet_vals = $sorted($keys(data));
  if ($truthy((($truthy(($t1 = ((outlet < $get(outlet_vals, 0)))))) ? $t1 : (((outlet > $get(outlet_vals, (-1)))))))) {
    return "Error: inlet pressure is out of range for given outlet pressure";
  }
  outlet_low = $max((() => { const $r = []; for (const p of $iter(outlet_vals)) { if ($truthy(((p <= outlet)))) $r.push(p); } return $r; })());
  outlet_high = $min((() => { const $r = []; for (const p of $iter(outlet_vals)) { if ($truthy(((p >= outlet)))) $r.push(p); } return $r; })());
  function inlet_interpolate(section) {
    let f0, f1, inlet_high, inlet_low, inlet_vals, reg, result, u, $t2, $t3, $t4;
    inlet_vals = $sorted($keys(section));
    if ($truthy((($truthy(($t3 = (!$truthy(inlet_vals))))) ? $t3 : ((($truthy(($t2 = ((inlet < $get(inlet_vals, 0)))))) ? $t2 : (((inlet > $get(inlet_vals, (-1)))))))))) {
      return null;
    }
    inlet_low = $max((() => { const $r = []; for (const p of $iter(inlet_vals)) { if ($truthy(((p <= inlet)))) $r.push(p); } return $r; })());
    inlet_high = $min((() => { const $r = []; for (const p of $iter(inlet_vals)) { if ($truthy(((p >= inlet)))) $r.push(p); } return $r; })());
    u = ($truthy(((!$eq(inlet_high, inlet_low)))) ? (((inlet - inlet_low) / (inlet_high - inlet_low))) : (0));
    result = new Map([]);
    for (const reg of $iter($get(section, inlet_low))) {
      f0 = $get($get(section, inlet_low), reg);
      f1 = $get($get(section, inlet_high), reg);
      if ($truthy((($truthy(($t4 = ((f0 === null))))) ? $t4 : (((f1 === null)))))) {
        $set(result, reg, null);
      } else {
        $set(result, reg, $add(((1 - u) * f0), (u * f1)));
      }
    }
    return result;
  }
  cap_low = inlet_interpolate($get(data, outlet_low));
  cap_high = inlet_interpolate($get(data, outlet_high));
  if ($truthy((($truthy(($t5 = ((cap_low === null))))) ? $t5 : (((cap_high === null)))))) {
    return "Error: inlet pressure is out of range for given outlet pressure";
  }
  t = ($truthy(((!$eq(outlet_high, outlet_low)))) ? (((outlet - outlet_low) / (outlet_high - outlet_low))) : (0));
  capacities = new Map([]);
  for (const reg of $iter(cap_low)) {
    v_low = $get(cap_low, reg);
    v_high = $dget(cap_high, reg, null);
    if ($truthy((($truthy(($t6 = ((v_low === null))))) ? $t6 : (((v_high === null)))))) {
      $set(capacities, reg, "N/A");
      continue;
    }
    interpolated = $add(((1 - t) * v_low), (t * v_high));
    if ($truthy(monitor_used)) {
      interpolated *= 0.7;
    }
    if ($truthy(vp)) {
      interpolated *= 0.8;
    }
    interpolated *= gastypemult;
    if ($truthy(((Patm < 14.4)))) {
      ratio = ($add(inlet, Patm) / $add(outlet, Patm));
      if ($truthy(((ratio < 1.894)))) {
        alt_adj = (Math.pow(($add(outlet, Patm) * ($add(inlet, Patm) - $add(outlet, Patm))), 0.5) / Math.pow(($add(outlet, 14.65) * ($add(inlet, 14.65) - $add(outlet, 14.65))), 0.5));
      } else {
        alt_adj = ($add(inlet, Patm) / $add(inlet, 14.65));
      }
      if ($truthy(((alt_adj < 1)))) {
        interpolated *= alt_adj;
      }
    }
    $set(capacities, reg, Math.trunc($round(interpolated)));
  }
  return capacities;
}
function body_type121(reg) {
  let suf;
  suf = $slice(reg, (-2), null);
  if ($truthy(($eq(suf, "13")))) {
    return "3/4\" or 1\"";
  } else {
    if ($truthy(($eq(suf, "10")))) {
      return "1\"";
    } else {
      if ($truthy(($eq(suf, "1Q")))) {
        return "1-1/4\"";
      } else {
        if ($truthy(($eq(suf, "1H")))) {
          return "1-1/2\"";
        } else {
          if ($truthy(($eq(suf, "20")))) {
            return "2\"";
          } else {
            if ($truthy(($eq(suf, "2H")))) {
              return "2-1/2\"";
            } else {
              if ($truthy(($eq(suf, "30")))) {
                return "3\"";
              }
            }
          }
        }
      }
    }
  }
  return "Unknown";
}
function body_max121(reg) {
  let pre, suf, $t7;
  pre = $slice(reg, null, 6);
  suf = $slice(reg, (-2), null);
  if ($truthy((($truthy(($t7 = ($eq(pre, "R12208"))))) ? $t7 : (($eq(pre, "R12212")))))) {
    return 15;
  } else {
    if ($truthy(($eq(suf, "30")))) {
      return 40;
    } else {
      return 60;
    }
  }
}
function spring_121_122(op, reg) {
  let $t10, $t11, $t12, $t13, $t14, $t15, $t16, $t17, $t18, $t19, $t20, $t21, $t22, $t23, $t24, $t25, $t26, $t27, $t8, $t9;
  if ($truthy((($truthy(($t8 = ($eq(reg, "R1210813"))))) ? $t8 : (($eq(reg, "R121081Q")))))) {
    if ($truthy((($truthy(($t9 = ((op >= (1.5 / 28)))))) ? (((op <= (3.5 / 28)))) : $t9))) {
      return new Map([["color", "Blue-Black with Black-Red counter"], ["range", "(1.5\" - 3.5\" wc)"]]);
    } else {
      if ($truthy(((op < (6.5 / 28))))) {
        return new Map([["color", "Red-Black"], ["range", "(3.5\" - 6.5\" wc)"]]);
      } else {
        if ($truthy(((op < (8.5 / 28))))) {
          return new Map([["color", "Blue-Black"], ["range", "(5\" - 8.5\" wc)"]]);
        } else {
          if ($truthy(((op < (14 / 28))))) {
            return new Map([["color", "Green-Black"], ["range", "(12\" - 28\" wc)"]]);
          } else {
            if ($truthy(((op <= 1)))) {
              return new Map([["color", "Green"], ["range", "(12\" - 28\" wc)"]]);
            } else {
              if ($truthy(((op <= 2)))) {
                return new Map([["color", "Orange"], ["range", "(1 - 2 psi)"]]);
              } else {
                if ($truthy(((op <= 4.25)))) {
                  return new Map([["color", "Black"], ["range", "(2 - 4.25 psi)"]]);
                } else {
                  return new Map([["color", null], ["range", null]]);
                }
              }
            }
          }
        }
      }
    }
  } else {
    if ($truthy((($truthy(($t11 = ($eq(reg, "R121081H"))))) ? $t11 : ((($truthy(($t10 = ($eq(reg, "R1210820"))))) ? $t10 : (($eq(reg, "R121082H")))))))) {
      if ($truthy((($truthy(($t12 = ((op >= 1))))) ? (((op <= 2))) : $t12))) {
        return new Map([["color", "Orange"], ["range", "(1 - 2 psi)"]]);
      } else {
        if ($truthy(((op <= 4.25)))) {
          return new Map([["color", "Black"], ["range", "(2 - 4.25 psi)"]]);
        } else {
          return new Map([["color", null], ["range", null]]);
        }
      }
    } else {
      if ($truthy((($truthy(($t14 = ($eq(reg, "R121121H"))))) ? $t14 : ((($truthy(($t13 = ($eq(reg, "R1211220"))))) ? $t13 : (($eq(reg, "R121122H")))))))) {
        if ($truthy((($truthy(($t15 = ((op >= (1.5 / 28)))))) ? (((op <= (3.5 / 28)))) : $t15))) {
          return new Map([["color", "Red with counter"], ["range", "(1.5\" - 3.5\" wc)"]]);
        } else {
          if ($truthy(((op < (6.5 / 28))))) {
            return new Map([["color", "Red"], ["range", "(3.5\" - 6.5\" wc)"]]);
          } else {
            if ($truthy(((op < (8.5 / 28))))) {
              return new Map([["color", "Blue"], ["range", "(5\" - 8.5\" wc)"]]);
            } else {
              if ($truthy(((op < (14 / 28))))) {
                return new Map([["color", "Green"], ["range", "(6\" - 14\" wc)"]]);
              } else {
                if ($truthy(((op <= 1)))) {
                  return new Map([["color", "Orange"], ["range", "(12\" - 28\" wc)"]]);
                } else {
                  if ($truthy(((op < 2)))) {
                    return new Map([["color", "Black"], ["range", "(1 - 2 psi)"]]);
                  } else {
                    if ($truthy(((op <= 3)))) {
                      return new Map([["color", "Cadmium"], ["range", "(1.5 - 3 psi)"]]);
                    } else {
                      return new Map([["color", null], ["range", null]]);
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        if ($truthy(($eq(reg, "R1211230")))) {
          if ($truthy((($truthy(($t16 = ((op >= 1))))) ? (((op < 2))) : $t16))) {
            return new Map([["color", "Black"], ["range", "(1 - 2 psi)"]]);
          } else {
            if ($truthy(((op <= 3)))) {
              return new Map([["color", "Cadmium"], ["range", "(1.5 - 3 psi)"]]);
            } else {
              return new Map([["color", null], ["range", null]]);
            }
          }
        } else {
          if ($truthy(($eq(reg, "R1211630")))) {
            if ($truthy((($truthy(($t17 = ((op >= (3.5 / 28)))))) ? (((op < (6.5 / 28)))) : $t17))) {
              return new Map([["color", "Red"], ["range", "(3.5\" - 6.5\" wc)"]]);
            } else {
              if ($truthy(((op < (8.5 / 28))))) {
                return new Map([["color", "Blue"], ["range", "(5\" - 8.5\" wc)"]]);
              } else {
                if ($truthy(((op < (14 / 28))))) {
                  return new Map([["color", "Green"], ["range", "(6\" - 14\" wc)"]]);
                } else {
                  if ($truthy(((op < 1)))) {
                    return new Map([["color", "Orange"], ["range", "(14\" - 28\" wc)"]]);
                  } else {
                    if ($truthy(((op <= 1.25)))) {
                      return new Map([["color", "Yellow"], ["range", "(0.5 - 1.25 psi)"]]);
                    } else {
                      return new Map([["color", null], ["range", null]]);
                    }
                  }
                }
              }
            }
          } else {
            if ($truthy((($truthy(($t21 = ($eq(reg, "R121HP13"))))) ? $t21 : ((($truthy(($t20 = ($eq(reg, "R121HP1Q"))))) ? $t20 : ((($truthy(($t19 = ($eq(reg, "R121HP1H"))))) ? $t19 : ((($truthy(($t18 = ($eq(reg, "R121HP20"))))) ? $t18 : (($eq(reg, "R121HP2H")))))))))))) {
              if ($truthy((($truthy(($t22 = ((op >= 3))))) ? (((op < 6.5))) : $t22))) {
                return new Map([["color", "Cadmium"], ["range", "(3 - 6.5 psi)"]]);
              } else {
                if ($truthy(((op <= 10)))) {
                  return new Map([["color", "Cadmium + White"], ["range", "(6 - 10 psi)"]]);
                } else {
                  return new Map([["color", null], ["range", null]]);
                }
              }
            } else {
              if ($truthy((($truthy(($t23 = ($eq(reg, "R1220810"))))) ? $t23 : (($eq(reg, "R122081Q")))))) {
                if ($truthy((($truthy(($t24 = ((op >= (1.5 / 28)))))) ? (((op <= (3.5 / 28)))) : $t24))) {
                  return new Map([["color", "Blue-black with Black counter"], ["range", "(1.5\" - 3.5\" wc)"]]);
                } else {
                  if ($truthy(((op < (6.5 / 28))))) {
                    return new Map([["color", "Red-Black"], ["range", "(3.5\" - 6.5\" wc)"]]);
                  } else {
                    if ($truthy(((op < (8.5 / 28))))) {
                      return new Map([["color", "Blue-Black"], ["range", "(5\" - 8.5\" wc)"]]);
                    } else {
                      if ($truthy(((op < (14 / 28))))) {
                        return new Map([["color", "Green-Black"], ["range", "(6\" - 14\" wc)"]]);
                      } else {
                        if ($truthy(((op <= 1)))) {
                          return new Map([["color", "Green"], ["range", "(12\" - 28\" wc)"]]);
                        } else {
                          if ($truthy(((op <= 2)))) {
                            return new Map([["color", "Orange"], ["range", "(1 - 2 psi)"]]);
                          } else {
                            return new Map([["color", null], ["range", null]]);
                          }
                        }
                      }
                    }
                  }
                }
              } else {
                if ($truthy((($truthy(($t26 = ($eq(reg, "R122121H"))))) ? $t26 : ((($truthy(($t25 = ($eq(reg, "R1221220"))))) ? $t25 : (($eq(reg, "R122122H")))))))) {
                  if ($truthy((($truthy(($t27 = ((op >= (1.5 / 28)))))) ? (((op <= (3.5 / 28)))) : $t27))) {
                    return new Map([["color", "Red with Red-Black counter"], ["range", "(1.5 - 3.5)"]]);
                  } else {
                    if ($truthy(((op < (6.5 / 28))))) {
                      return new Map([["color", "Red"], ["range", "(3.5\" - 6.5\" wc)"]]);
                    } else {
                      if ($truthy(((op < (8.5 / 28))))) {
                        return new Map([["color", "Blue"], ["range", "(5\" - 8.5\" wc)"]]);
                      } else {
                        if ($truthy(((op < (14 / 28))))) {
                          return new Map([["color", "Green"], ["range", "(6\" - 14\" wc)"]]);
                        } else {
                          if ($truthy(((op <= 1)))) {
                            return new Map([["color", "Orange"], ["range", "(12\" - 28\" wc)"]]);
                          } else {
                            if ($truthy(((op <= 2)))) {
                              return new Map([["color", "Black"], ["range", "(1 - 2 psi)"]]);
                            } else {
                              return new Map([["color", null], ["range", null]]);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return new Map([["color", "None"], ["range", "None"]]);
}
function will_work_vp(cap, reg, vp) {
  let min, $t28, $t29;
  if ($truthy(($eq(cap, "N/A")))) {
    return "No";
  } else {
    if ($truthy(vp)) {
      min = 40;
    } else {
      min = 20;
    }
    if ($truthy((($truthy(($t29 = ((cap >= (flow_rate * oversizeby)))))) ? ((($truthy(($t28 = (((cap / min) <= min_flow))))) ? (((body_max121(reg) >= maop))) : $t28)) : $t29))) {
      return "Yes";
    } else {
      return "No";
    }
  }
}
function body_size_min121(ip, reg) {
  if ($truthy(($eq(reg, "R1210813")))) {
    if ($truthy(((ip <= 3)))) {
      return "1\"";
    } else {
      if ($truthy(((ip <= 40)))) {
        return "2\"";
      } else {
        if ($truthy(((ip <= 60)))) {
          return "3\"";
        }
      }
    }
  } else {
    if ($truthy(($eq(reg, "R121081Q")))) {
      if ($truthy(((ip <= 5)))) {
        return "1.25\"";
      } else {
        if ($truthy(((ip <= 25)))) {
          return "2\"";
        } else {
          if ($truthy(((ip <= 60)))) {
            return "3\"";
          }
        }
      }
    } else {
      if ($truthy(($eq(reg, "R121081H")))) {
        if ($truthy(((ip <= 40)))) {
          return "1.5\"";
        } else {
          if ($truthy(((ip <= 60)))) {
            return "2\"";
          }
        }
      } else {
        if ($truthy(($eq(reg, "R1210820")))) {
          if ($truthy(((ip <= 40)))) {
            return "2\"";
          } else {
            if ($truthy(((ip <= 60)))) {
              return "3\"";
            }
          }
        } else {
          if ($truthy(($eq(reg, "R121082H")))) {
            if ($truthy(((ip <= 40)))) {
              return "2.5\"";
            } else {
              if ($truthy(((ip <= 60)))) {
                return "3\"";
              }
            }
          } else {
            if ($truthy(($eq(reg, "R121121H")))) {
              if ($truthy(((ip <= 3)))) {
                return "1.5\"";
              } else {
                if ($truthy(((ip <= 15)))) {
                  return "2\"";
                } else {
                  if ($truthy(((ip <= 60)))) {
                    return "3\"";
                  }
                }
              }
            } else {
              if ($truthy(($eq(reg, "R1211220")))) {
                if ($truthy(((ip <= 5)))) {
                  return "2\"";
                } else {
                  if ($truthy(((ip <= 25)))) {
                    return "3\"";
                  } else {
                    if ($truthy(((ip <= 60)))) {
                      return "4\"";
                    }
                  }
                }
              } else {
                if ($truthy(($eq(reg, "R121122H")))) {
                  if ($truthy(((ip <= 5)))) {
                    return "2.5\"";
                  } else {
                    if ($truthy(((ip <= 25)))) {
                      return "3\"";
                    } else {
                      if ($truthy(((ip <= 60)))) {
                        return "4\"";
                      }
                    }
                  }
                } else {
                  if ($truthy(($eq(reg, "R1211230")))) {
                    if ($truthy(((ip <= 40)))) {
                      return "3\"";
                    }
                  } else {
                    if ($truthy(($eq(reg, "R1211630")))) {
                      if ($truthy(((ip <= 5)))) {
                        return "3\"";
                      } else {
                        if ($truthy(((ip <= 15)))) {
                          return "4\"";
                        } else {
                          if ($truthy(((ip <= 40)))) {
                            return "6\"";
                          }
                        }
                      }
                    } else {
                      if ($truthy(($eq(reg, "R121HP13")))) {
                        if ($truthy(((ip <= 50)))) {
                          return "1\"";
                        } else {
                          if ($truthy(((ip <= 60)))) {
                            return "2\"";
                          }
                        }
                      } else {
                        if ($truthy(($eq(reg, "R121HP1Q")))) {
                          if ($truthy(((ip <= 40)))) {
                            return "1.25\"";
                          } else {
                            if ($truthy(((ip <= 60)))) {
                              return "2\"";
                            }
                          }
                        } else {
                          if ($truthy(($eq(reg, "R121HP1H")))) {
                            if ($truthy(((ip <= 40)))) {
                              return "1.5\"";
                            } else {
                              if ($truthy(((ip <= 60)))) {
                                return "2\"";
                              }
                            }
                          } else {
                            if ($truthy(($eq(reg, "R121HP20")))) {
                              if ($truthy(((ip <= 40)))) {
                                return "2\"";
                              } else {
                                if ($truthy(((ip <= 60)))) {
                                  return "3\"";
                                }
                              }
                            } else {
                              if ($truthy(($eq(reg, "R121HP2H")))) {
                                if ($truthy(((ip <= 40)))) {
                                  return "2.5\"";
                                } else {
                                  if ($truthy(((ip <= 60)))) {
                                    return "3\"";
                                  }
                                }
                              } else {
                                return "None";
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
function gen_match121(result121, result122, vp, opp) {
  let body, body_order121, cap, label, match, model_labels_121, model_labels_121122, mon_color, monset, novp_pipe_priority, ordered_body121, prefix, priority_list, reg, res, vp_pipe_priority, $t30, $t31, $t32, $t33, $t34, $t35, $t36, $t37, $t38, $t39, $t40, $t41, $t42, $t43, $t44;
  match = null;
  monset = 0;
  if ($truthy(($eq(opp, "Monitor")))) {
    if ($truthy(((outlet_input < 1)))) {
      monset = $add(outlet_input, 0.5);
    } else {
      if ($truthy(($eq(outlet_input, 1)))) {
        monset = 2;
      } else {
        if ($truthy(((outlet_input <= 3)))) {
          monset = $add(outlet_input, 1.25);
        } else {
          if ($truthy(((outlet_input <= 8)))) {
            monset = $add(outlet_input, 2);
          } else {
            monset = 10;
          }
        }
      }
    }
  }
  if ($truthy(($in("irv_input", $GLOBALS)))) {
    if ($truthy((($truthy(($t30 = ((!$eq(irv_input, 0)))))) ? (((monset > irv_input))) : $t30))) {
      monset = irv_input;
    }
  }
  if ($truthy(vp)) {
    body_order121 = ["1H", "20", "2H"];
    vp_pipe_priority = new Map([["1-1/2\"", ["1H"]], ["2\"", ["20"]], ["2-1/2\"", ["2H"]]]);
    priority_list = $dget(vp_pipe_priority, pipesize_input, []);
    ordered_body121 = $add(priority_list, (() => { const $r = []; for (const b of $iter(body_order121)) { if ($truthy(((!$in(b, priority_list))))) $r.push(b); } return $r; })());
    model_labels_121 = new Map([["R12108", "121-8"], ["R12112", "121-12"]]);
    if ($truthy(((outlet_input <= 3)))) {
      for (const [prefix, label] of $iter($items(model_labels_121))) {
        for (const body of $iter(ordered_body121)) {
          reg = `${$str(prefix)}${$str(body)}`;
          if ($truthy(($in(reg, result121)))) {
            cap = $get(result121, reg);
            if ($truthy(($eq(will_work_vp(cap, reg, vp), "Yes")))) {
              mon_color = ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_121_122(monset, reg), "color")) : (null));
              if ($truthy((($truthy(($t32 = ($eq(opp, "None"))))) ? $t32 : ((($truthy(($t31 = ($eq(opp, "Monitor"))))) ? (((!$eq(mon_color, null)))) : $t31))))) {
                match = new Map([["reg", reg], ["model", $get(model_labels_121, prefix)], ["diap", null], ["body", body_type121(reg)], ["orifice", "V-Port"], ["seat", null], ["color", $get(spring_121_122(outlet_input, reg), "color")], ["range", $get(spring_121_122(outlet_input, reg), "range")], ["capacity", cap], ["opp", opp], ["mon_color", mon_color], ["mon_range", $get(spring_121_122(monset, reg), "range")]]);
                return match;
              }
            }
          }
        }
      }
    } else {
      for (const body of $iter(ordered_body121)) {
        reg = `R121HP${$str(body)}`;
        if ($truthy(($in(reg, result121)))) {
          cap = $get(result121, reg);
          if ($truthy(($eq(will_work_vp(cap, reg, vp), "Yes")))) {
            mon_color = ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_121_122(monset, reg), "color")) : (null));
            if ($truthy((($truthy(($t34 = ($eq(opp, "None"))))) ? $t34 : ((($truthy(($t33 = ($eq(opp, "Monitor"))))) ? (((!$eq(mon_color, null)))) : $t33))))) {
              match = new Map([["reg", reg], ["model", "121-8-HP"], ["diap", null], ["body", body_type121(reg)], ["orifice", "V-Port"], ["seat", null], ["color", $get(spring_121_122(outlet_input, reg), "color")], ["range", $get(spring_121_122(outlet_input, reg), "range")], ["capacity", cap], ["opp", opp], ["mon_color", mon_color], ["mon_range", $get(spring_121_122(monset, reg), "range")]]);
              return match;
            }
          }
        }
      }
    }
  } else {
    body_order121 = ["13", "10", "1Q", "1H", "20", "2H", "30"];
    novp_pipe_priority = new Map([["3/4\"", ["13"]], ["1\"", ["13", "10"]], ["1-1/4\"", ["1Q"]], ["1-1/2\"", ["1H"]], ["2\"", ["20"]], ["2-1/2\"", ["2H"]], ["3\"", ["30"]]]);
    priority_list = $dget(novp_pipe_priority, pipesize_input, []);
    ordered_body121 = $add(priority_list, (() => { const $r = []; for (const b of $iter(body_order121)) { if ($truthy(((!$in(b, priority_list))))) $r.push(b); } return $r; })());
    model_labels_121122 = new Map([["R12108", "121-8"], ["R12112", "121-12"], ["R12116", "121-16"], ["R12208", "122-8"], ["R12212", "122-12"]]);
    model_labels_121 = new Map([["R12108", "121-8"], ["R12112", "121-12"], ["R12116", "121-16"]]);
    if ($truthy((($truthy(($t38 = (($truthy(($t37 = (($truthy(($t35 = ((outlet_input <= 2))))) ? (($eq(opp, "None"))) : $t35)))) ? $t37 : ((($truthy(($t36 = ((outlet_input <= 1))))) ? (($eq(opp, "Monitor"))) : $t36)))))) ? (($eq(((typeof (result122) === 'string')), false))) : $t38))) {
      for (const [prefix, label] of $iter($items(model_labels_121122))) {
        res = ($truthy((prefix).startsWith("R121")) ? (result121) : (result122));
        for (const body of $iter(ordered_body121)) {
          reg = `${$str(prefix)}${$str(body)}`;
          if ($truthy(($in(reg, res)))) {
            cap = $get(res, reg);
            if ($truthy(($eq(will_work_vp(cap, reg, vp), "Yes")))) {
              mon_color = ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_121_122(monset, reg), "color")) : (null));
              if ($truthy((($truthy(($t40 = ($eq(opp, "None"))))) ? $t40 : ((($truthy(($t39 = ($eq(opp, "Monitor"))))) ? (((!$eq(mon_color, null)))) : $t39))))) {
                match = new Map([["reg", reg], ["model", $get(model_labels_121122, prefix)], ["diap", null], ["body", body_type121(reg)], ["orifice", null], ["seat", null], ["color", $get(spring_121_122(outlet_input, reg), "color")], ["range", $get(spring_121_122(outlet_input, reg), "range")], ["capacity", cap], ["opp", opp], ["mon_color", mon_color], ["mon_range", $get(spring_121_122(monset, reg), "range")]]);
                return match;
              }
            }
          }
        }
      }
    } else {
      if ($truthy(((outlet_input <= 3)))) {
        for (const [prefix, label] of $iter($items(model_labels_121))) {
          for (const body of $iter(ordered_body121)) {
            reg = `${$str(prefix)}${$str(body)}`;
            if ($truthy(($in(reg, result121)))) {
              cap = $get(result121, reg);
              if ($truthy(($eq(will_work_vp(cap, reg, vp), "Yes")))) {
                mon_color = ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_121_122(monset, reg), "color")) : (null));
                if ($truthy((($truthy(($t42 = ($eq(opp, "None"))))) ? $t42 : ((($truthy(($t41 = ($eq(opp, "Monitor"))))) ? (((!$eq(mon_color, null)))) : $t41))))) {
                  match = new Map([["reg", reg], ["model", $get(model_labels_121, prefix)], ["diap", null], ["body", body_type121(reg)], ["orifice", null], ["seat", null], ["color", $get(spring_121_122(outlet_input, reg), "color")], ["range", $get(spring_121_122(outlet_input, reg), "range")], ["capacity", cap], ["opp", opp], ["mon_color", mon_color], ["mon_range", $get(spring_121_122(monset, reg), "range")]]);
                  return match;
                }
              }
            }
          }
        }
      } else {
        for (const body of $iter(ordered_body121)) {
          reg = `R121HP${$str(body)}`;
          if ($truthy(($in(reg, result121)))) {
            cap = $get(result121, reg);
            if ($truthy(($eq(will_work_vp(cap, reg, vp), "Yes")))) {
              mon_color = ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_121_122(monset, reg), "color")) : (null));
              if ($truthy((($truthy(($t44 = ($eq(opp, "None"))))) ? $t44 : ((($truthy(($t43 = ($eq(opp, "Monitor"))))) ? (((!$eq(mon_color, null)))) : $t43))))) {
                match = new Map([["reg", reg], ["model", "121-8-HP"], ["diap", null], ["body", body_type121(reg)], ["orifice", null], ["seat", null], ["color", $get(spring_121_122(outlet_input, reg), "color")], ["range", $get(spring_121_122(outlet_input, reg), "range")], ["capacity", cap], ["opp", opp], ["mon_color", mon_color], ["mon_range", $get(spring_121_122(monset, reg), "range")]]);
                return match;
              }
            }
          }
        }
      }
    }
  }
}
function run_regulator_selection121(inlet, outlet, opp) {
  let apply, data_used121, match, monitor, result121, result121_VP, result122, vp, warning, $t45;
  if ($truthy(((outlet_input <= 3)))) {
    data_used121 = stddata121;
  } else {
    data_used121 = hpdata121;
  }
  if ($truthy((($truthy(($t45 = ($eq(opp, "Monitor"))))) ? $t45 : (($eq(opp, "IRV")))))) {
    opp = "Monitor";
    monitor = true;
    warning = "Sized for worker/monitor setup";
  } else {
    opp = "None";
    monitor = false;
    warning = null;
  }
  vp = false;
  result121 = interpolate_capacity(data_used121, inlet, outlet, monitor, false);
  result121_VP = interpolate_capacity(data_used121, inlet, outlet, monitor, true);
  if ($truthy(((typeof (result121) === 'string')))) {
    warning = result121;
    result121 = null;
    result121_VP = null;
    result122 = null;
    match = null;
    apply = false;
    return [result121, result121_VP, result122, match, apply, warning];
  }
  result122 = interpolate_capacity(stddata122, inlet, outlet, monitor, vp);
  match = gen_match121(result121, result122, vp, opp);
  if ($truthy(match)) {
    apply = true;
  } else {
    vp = true;
    match = gen_match121(result121_VP, result122, vp, opp);
    if ($truthy(match)) {
      apply = true;
    } else {
      apply = false;
    }
  }
  return [result121, result121_VP, result122, match, apply, warning];
}
function hsc_pnc121(match) {
  let body, body_map121, body_map122, diap, model, monitor_spring, spring, spring_map, vp, $t46, $t47, $t48;
  body_map121 = new Map([["3/4\" or 1\"", "1SCD"], ["1\"", "1SCD"], ["1-1/4\"", "11/4SCD"], ["1-1/2\"", "11/2SCD"], ["2\"", "2SCD"], ["2-1/2\"", "21/2SCD"], ["3\"", "3SCD"]]);
  body_map122 = new Map([["3/4\" or 1\"", "1SCD"], ["1\"", "1SCD"], ["1-1/4\"", "1-1/4SCD"], ["1-1/2\"", "1-1/2SCD"], ["2\"", "2SCD"], ["2-1/2\"", "2-1/2SCD"], ["3\"", "3SCD"]]);
  spring_map = new Map([["Blue-Black with Black-Red counter", "37"], ["Red-Black", "1"], ["Blue-Black", "2"], ["Green-Black", "3"], ["Green", "12"], ["Orange", "13"], ["Black", "14"], ["Red with counter", "39"], ["Red", "10"], ["Blue", "11"], ["Cadmium", "15"], ["Yellow", "23"], ["Cadmium + White", "21"], ["Blue-black with Black counter", "33"], ["Red with Red-Black counter", "35"]]);
  if ($truthy($get(match, "orifice"))) {
    vp = "VPORT";
  } else {
    vp = "STD";
  }
  model = $get(match, "model");
  if ($truthy((($truthy(($t46 = ($eq(model, "122-12"))))) ? $t46 : (($eq(model, "122-8")))))) {
    body = $dget(body_map122, $get(match, "body"), null);
  } else {
    body = $dget(body_map121, $get(match, "body"), null);
  }
  spring = $dget(spring_map, $get(match, "color"), null);
  monitor_spring = $dget(spring_map, $get(match, "mon_color"), null);
  if ($truthy(($eq(model, "121-16")))) {
    diap = "16";
  } else {
    if ($truthy((($truthy(($t47 = ($eq(model, "122-12"))))) ? $t47 : (($eq(model, "121-12")))))) {
      diap = "12";
    } else {
      if ($truthy(($eq(model, "121-8-HP")))) {
        diap = "8-HP";
      } else {
        diap = "8";
      }
    }
  }
  if ($truthy((($truthy(($t48 = ($eq(model, "122-8"))))) ? $t48 : (($eq(model, "122-12")))))) {
    if ($truthy(($eq($get(match, "opp"), "Monitor")))) {
      return [`R.${$str(model)}.STD.${$str(body)}.${$str(diap)}.EXTCON.STD.STD.${$str(monitor_spring)}.ALU`, `R.${$str(model)}.STD.${$str(body)}.${$str(diap)}.INTCON.STD.STD.${$str(spring)}.ALU`];
    } else {
      return `R.${$str(model)}.STD.${$str(body)}.${$str(diap)}.EXTCON.STD.STD.${$str(spring)}.ALU`;
    }
  } else {
    if ($truthy(($eq($get(match, "opp"), "Monitor")))) {
      return [`R.${$str(model)}.STD.${$str(body)}.${$str(diap)}.EXTCON.STD.STD.${$str(vp)}.${$str(monitor_spring)}.ALU`, `R.${$str(model)}.STD.${$str(body)}.${$str(diap)}.EXTCON.STD.STD.${$str(vp)}.${$str(spring)}.ALU`];
    } else {
      return `R.${$str(model)}.STD.${$str(body)}.${$str(diap)}.EXTCON.STD.STD.${$str(vp)}.${$str(spring)}.ALU`;
    }
  }
}


// ============================================================================
//  Wrapper around the transpiled Model 121/122 algorithm.
//
//  Everything the Streamlit front end used to do around
//  run_regulator_selection121(): unit conversion, validation, oversize maths,
//  the Standard and V-Port capacity tables and result formatting.
//
//  This file is hand-written, NOT generated. Its Python twin is reference.py
//  in this same folder, and CI proves the two agree on every input it tests,
//  so this cannot silently drift from the algorithm's expectations.
//
//  build/build.py exposes this as USGSizing.sizeModel121(input), per the
//  "method" field in tool.json.
// ============================================================================

var PIPE_OPTIONS = ["N/A", '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"'];
var INLET_UNITS = ["psi", "bar", "kPa"];
var OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"];
var FLOW_UNITS = ["CFH", "CMH", "BTUH"];
var GAS_TYPES = ["Natural Gas", "Propane", "Other"];

// Registers that have no V-Port variant, so they are dropped from the V-Port
// tables (matches _VP_EXCLUDE in the Streamlit app).
var VP_EXCLUDE = ['R1210813', 'R121081Q', 'R1211230', 'R1211630', 'R121HP13', 'R121HP1Q'];

// Models whose selection carries an outlet pipe sizing requirement.
var PIPE_NOTE_MODELS = ["121-8", "121-12", "121-16", "121-HP"];

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
    pipe_size: "N/A",
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

// One capacity table, or null when no register matches. Unlike the other
// tools, the 121's tables list the BODY size per row rather than an orifice,
// and the V-Port variants drop the excluded registers.
function buildTable(title, prefix, result, vp) {
  var rows = [];
  result.forEach(function (capacity, reg) {
    if (String(reg).indexOf(prefix) !== 0) return;
    if (vp && VP_EXCLUDE.indexOf(String(reg)) !== -1) return;
    var body = body_type121(reg);
    var capStr = (typeof capacity === 'number') ? $format(capacity, ',.0f') : String(capacity);
    var works = will_work_vp(capacity, reg, vp);
    rows.push([body, capStr, works]);
  });
  if (!rows.length) return null;   // Streamlit skipped empty frames
  return {
    title: title,
    headers: ["Body Size", "Calculated Capacity (CFH)", "Will Reg Work"],
    rows: rows
  };
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

  var pipesize_raw = p.pipe_size;
  var pipesize_input = (pipesize_raw === "N/A") ? 0 : pipesize_raw;

  // The 121/122 offers monitor protection only - there is no IRV option.
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
  if (inlet_psi > 0 && (inlet_psi > 60 || inlet_psi < 8 / 28)) {
    errors.push("Inlet pressure must be between 8\" wc and 60 psi.");
  }
  if (outlet_psi > 0 && (outlet_psi < 1.5 / 28 || outlet_psi > 10)) {
    errors.push("Outlet pressure must be between 1.5\" wc and 10 psi.");
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
    pipesize_input: pipesize_input,
    opp_type: opp_type,
    irv_input: 0,
    oversizeby: oversizeby,
    oversize_percent: oversize_percent,
    gastypemult: gastypemult,
    pload: pload,
    Patm: Patm
  });

  var r;
  try {
    // Six return values, unlike the other tools: the standard result map, the
    // V-Port map, the 122 map, then the selection.
    r = run_regulator_selection121(inlet_psi, outlet_psi, opp_type);
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 121 sizing algorithm error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  var result121 = r[0], result121_VP = r[1], result122 = r[2];
  var match = r[3], apply = r[4], warning = r[5];

  var warnings = $truthy(warning) ? [warning] : [];

  // No result map at all means the algorithm stopped early.
  if (!$truthy(match) && (result121 === null || result121 === undefined)) {
    return {
      ok: true,
      selected: false,
      errors: [],
      warnings: warnings,
      message: "Model 121/122 will not work for this application.",
      stopped: true
    };
  }

  function mget(key) {
    return (match instanceof Map) ? match.get(key) : (match ? match[key] : null);
  }

  // The original keys the selection block off match121 being truthy, not off
  // apply121 - keep that, because they can differ.
  var selected = !!$truthy(match);

  var out = {
    ok: true,
    selected: selected,
    errors: [],
    warnings: warnings,
    message: selected ? "Regulator selected!" : "Model 121/122 will not work for this application."
  };

  if (selected) {
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

    // ---- outlet pipe sizing note ----
    out.pipe_note = null;
    var modelName = String(mget('model') === null || mget('model') === undefined ? '' : mget('model'));
    for (var m = 0; m < PIPE_NOTE_MODELS.length; m++) {
      if (modelName.indexOf(PIPE_NOTE_MODELS[m]) !== -1) {
        var pipeReq;
        try {
          pipeReq = body_size_min121(inlet_psi, mget('reg'));
        } catch (err2) {
          pipeReq = null;
        }
        if ($truthy(pipeReq)) {
          out.pipe_note = "Model 121 regulators have outlet pipe sizing requirements. " +
            "This regulator was sized for use with " + pipeReq + " outlet pipe. " +
            "For capacities with smaller outlet piping, see regulator brochure.";
        }
        break;
      }
    }

    var pns = [];
    var pn = hsc_pnc121(match);
    var pnList = Array.isArray(pn) ? pn : [pn];
    for (var q = 0; q < pnList.length; q++) if ($truthy(pnList[q])) pns.push(pnList[q]);
    out.part_numbers = pns;
  }

  // ---- capacity tables ----
  // Standard and V-Port sets, with which models appear depending on the outlet
  // pressure and whether a monitor is used. Same conditions and order as the
  // Streamlit app.
  //
  // Guarded like the selection run: a body or spring lookup can fault on a
  // value outside its table, and that must produce a readable message rather
  // than a broken page.
  var sections = [];
  try {
    var addSection = function (label, entries) {
      var tables = [];
      for (var b = 0; b < entries.length; b++) {
        var t = buildTable(entries[b][0], entries[b][1], entries[b][2], entries[b][3]);
        if (t) tables.push(t);
      }
      if (tables.length) sections.push({ label: label, tables: tables });
    };

    var show122 = (typeof result122 !== 'string') && (
      (outlet_psi <= 2 && opp_type !== "Monitor") ||
      (outlet_psi <= 1 && opp_type === "Monitor")
    );

    if (show122) {
      // Standard + V-Port + the 122 models
      addSection("Standard Valves", [
        ["Model 121-8", "R12108", result121, false],
        ["Model 121-12", "R12112", result121, false],
        ["Model 121-16", "R12116", result121, false],
        ["Model 122-8", "R12208", result122, false],
        ["Model 122-12", "R12212", result122, false]
      ]);
      addSection("V-Port Valves", [
        ["Model 121-8", "R12108", result121_VP, true],
        ["Model 121-12", "R12112", result121_VP, true]
      ]);
    } else if (outlet_psi <= 3) {
      // Standard + V-Port, no 122
      addSection("Standard Valves", [
        ["Model 121-8", "R12108", result121, false],
        ["Model 121-12", "R12112", result121, false],
        ["Model 121-16", "R12116", result121, false]
      ]);
      addSection("V-Port Valves", [
        ["Model 121-8", "R12108", result121_VP, true],
        ["Model 121-12", "R12112", result121_VP, true]
      ]);
    } else {
      // High-pressure models only
      addSection("Standard Valves", [["Model 121-8-HP", "R121HP", result121, false]]);
      addSection("V-Port Valves", [["Model 121-HP", "R121HP", result121_VP, true]]);
    }
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG 121 table build error', err, rawInput);
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
    // Whole numbers only. The original tool computed min_flow after the float
    // conversion so it printed "5,000.0"; a flow rate reads better without the
    // decimal, so it is rounded for display here.
    kv("Min Flow Rate (" + p.flow_units + ")", $format($round(min_flow), ',')),
    kv("Max Allowable Inlet Pressure (psi)", String(Math.trunc(maop))),
    kv("Requested Pipe Size", pipesize_raw),
    kv("Overpressure Protection Required", p.opp_required ? "Yes" : "No"),
    kv("Percent Load Feeding High-Efficiency Appliance", p.high_efficiency ? (pload_pct + "%") : "0"),
    kv("Override percentage regulator is oversized by",
      p.override_oversize ? ($format(oversize_percent, ".0f") + "%") : "No"),
    kv("Gas Type", p.gas_type)
  ];
  // Only meaningful for "Other" - the factor is derived from it, so the PDF
  // should record what was entered. Sits directly after Gas Type, as in every
  // other tool.
  if (p.gas_type === "Other") {
    summary.push(kv("Specific Gravity", $format(p.specific_gravity, ".2f")));
  }
  summary.push(kv("Altitude above 3,000 feet or atmospheric pressure below 13 psi",
    p.high_altitude ? "Yes" : "No"));
  if (p.high_altitude) summary.push(kv("Atmospheric Pressure (psi)", $format(Patm, ".1f")));
  out.summary = summary;

  // The PDF button is keyed off apply121, which can differ from match121.
  out.can_download = !!$truthy(apply);

  return out;
}


  function $setGlobals(values) {
    inlet_input = values.inlet_input;
    outlet_input = values.outlet_input;
    flow_rate = values.flow_rate;
    min_flow = values.min_flow;
    maop = values.maop;
    pipesize_input = values.pipesize_input;
    opp_type = values.opp_type;
    irv_input = values.irv_input;
    oversizeby = values.oversizeby;
    oversize_percent = values.oversize_percent;
    gastypemult = values.gastypemult;
    pload = values.pload;
    Patm = values.Patm;
  }

  function $setGlobal(name, value) {
    switch (name) {
      case 'inlet_input': inlet_input = value; return;
      case 'outlet_input': outlet_input = value; return;
      case 'flow_rate': flow_rate = value; return;
      case 'min_flow': min_flow = value; return;
      case 'maop': maop = value; return;
      case 'pipesize_input': pipesize_input = value; return;
      case 'opp_type': opp_type = value; return;
      case 'irv_input': irv_input = value; return;
      case 'oversizeby': oversizeby = value; return;
      case 'oversize_percent': oversize_percent = value; return;
      case 'gastypemult': gastypemult = value; return;
      case 'pload': pload = value; return;
      case 'Patm': Patm = value; return;
    }
    throw new Error('not an injected global: ' + name);
  }

  // Join the shared namespace rather than replacing it, so several tools can
  // coexist on one page without clobbering each other.
  var ns = root.USGSizing = root.USGSizing || {};
  ns.sizeModel121 = sizeTool;
  ns.options = ns.options || {};
  ns.options['model-121'] = {
    inlet_units: INLET_UNITS,
    outlet_units: OUTLET_UNITS,
    flow_units: FLOW_UNITS,
    pipe_sizes: PIPE_OPTIONS,
    gas_types: GAS_TYPES
  };
  ns.versions = ns.versions || {};
  ns.versions['model-121'] = {
    version: '1.1.0',
    algorithm: 'sha256:d49c25cc8331',
    sources: 'sha256:33b74c21d999'
  };
})(typeof window !== 'undefined' ? window : this);
