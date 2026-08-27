/*!
 * Model 243-RPC Sizing Tool
 * Holland Supply Company
 *
 * GENERATED FILE - DO NOT EDIT.
 * Built from tools/model-rpc/algorithm.py by build/build.py.
 * Edit the Python, push, and CI regenerates this file.
 *
 * tool:      model-rpc
 * version:   1.1.0
 * algorithm: sha256:20dd5a579944
 * sources:   sha256:1d14d1b3249a
 *
 * Adds to the shared namespace:
 *   USGSizing.sizeModelRPC(input)  -> result object
 *   USGSizing.versions['model-rpc']      -> build metadata
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
var $GLOBALS = new Map([["inlet_input",1],["outlet_input",1],["flow_rate",1],["maop",1],["model_input",1],["pipesize_input",1],["opp_type",1],["oversizeby",1],["oversize_percent",1],["gastypemult",1],["pload",1],["Patm",1],["resultRPC",1]]);
var $printBuf = [];
function $print(args) { $printBuf.push(args.map($str).join(' ')); }

var Patm, dataRPC, flow_rate, gastypemult, inlet_input, maop, model_input, opp_type, outlet_input, oversize_percent, oversizeby, pipesize_input, pload, resultRPC;
dataRPC = new Map([[0.125, new Map([[2, new Map([["RPCA_1Q", 9400], ["RPCA_10", 8100], ["RPCA_34", 4950], ["RPCA_12", 2340], ["RPCA_38", 1300], ["RPCA_14", 590], ["RPCB_1Q", 9400], ["RPCB_10", 8100], ["RPCB_34", 4950], ["RPCB_12", 2340], ["RPCB_38", 1300], ["RPCB_14", 590]])], [3, new Map([["RPCA_1Q", 11900], ["RPCA_10", 10200], ["RPCA_34", 6250], ["RPCA_12", 2950], ["RPCA_38", 1630], ["RPCA_14", 750], ["RPCB_1Q", 11900], ["RPCB_10", 10200], ["RPCB_34", 6250], ["RPCB_12", 2950], ["RPCB_38", 1630], ["RPCB_14", 750]])], [5, new Map([["RPCA_1Q", 16000], ["RPCA_10", 13800], ["RPCA_34", 8450], ["RPCA_12", 3950], ["RPCA_38", 2220], ["RPCA_14", 1000], ["RPCB_1Q", 16000], ["RPCB_10", 13800], ["RPCB_34", 8450], ["RPCB_12", 3950], ["RPCB_38", 2220], ["RPCB_14", 1000]])], [7, new Map([["RPCA_1Q", 19700], ["RPCA_10", 17000], ["RPCA_34", 10300], ["RPCA_12", 4900], ["RPCA_38", 2720], ["RPCA_14", 1220], ["RPCB_1Q", 19700], ["RPCB_10", 17000], ["RPCB_34", 10300], ["RPCB_12", 4900], ["RPCB_38", 2720], ["RPCB_14", 1220]])], [10, new Map([["RPCA_1Q", 24500], ["RPCA_10", 21000], ["RPCA_34", 12800], ["RPCA_12", 6000], ["RPCA_38", 3400], ["RPCA_14", 1550], ["RPCB_1Q", 22000], ["RPCB_10", 20000], ["RPCB_34", 12800], ["RPCB_12", 6000], ["RPCB_38", 3400], ["RPCB_14", 1550]])], [15, new Map([["RPCA_1Q", 31200], ["RPCA_10", 26700], ["RPCA_34", 16300], ["RPCA_12", 7700], ["RPCA_38", 4300], ["RPCA_14", 2000], ["RPCB_1Q", 22000], ["RPCB_10", 20000], ["RPCB_34", 16300], ["RPCB_12", 7700], ["RPCB_38", 4300], ["RPCB_14", 2000]])], [20, new Map([["RPCA_1Q", 36400], ["RPCA_10", 31200], ["RPCA_34", 19000], ["RPCA_12", 9000], ["RPCA_38", 5000], ["RPCA_14", 2300], ["RPCB_1Q", 22000], ["RPCB_10", 20000], ["RPCB_34", 19000], ["RPCB_12", 9000], ["RPCB_38", 5000], ["RPCB_14", 2300]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 22000], ["RPCB_10", 20000], ["RPCB_34", 20000], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 22000], ["RPCB_10", 20000], ["RPCB_34", 20000], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 20000], ["RPCB_34", 20000], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 20000], ["RPCB_34", 20000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 20000], ["RPCB_34", 20000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 20000], ["RPCB_12", 20000], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 20000], ["RPCB_12", 20000], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 20000], ["RPCB_12", 20000], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 20000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [0.25, new Map([[2, new Map([["RPCA_1Q", 9000], ["RPCA_10", 7800], ["RPCA_34", 4800], ["RPCA_12", 2250], ["RPCA_38", 1250], ["RPCA_14", 575], ["RPCB_1Q", 9000], ["RPCB_10", 7800], ["RPCB_34", 4800], ["RPCB_12", 2250], ["RPCB_38", 1250], ["RPCB_14", 575]])], [3, new Map([["RPCA_1Q", 11700], ["RPCA_10", 10000], ["RPCA_34", 6150], ["RPCA_12", 2900], ["RPCA_38", 1630], ["RPCA_14", 700], ["RPCB_1Q", 11700], ["RPCB_10", 10000], ["RPCB_34", 6150], ["RPCB_12", 2900], ["RPCB_38", 1630], ["RPCB_14", 700]])], [5, new Map([["RPCA_1Q", 16000], ["RPCA_10", 13700], ["RPCA_34", 8350], ["RPCA_12", 3900], ["RPCA_38", 2200], ["RPCA_14", 1000], ["RPCB_1Q", 16000], ["RPCB_10", 13700], ["RPCB_34", 8350], ["RPCB_12", 3900], ["RPCB_38", 2200], ["RPCB_14", 1000]])], [7, new Map([["RPCA_1Q", 19700], ["RPCA_10", 16800], ["RPCA_34", 10300], ["RPCA_12", 4850], ["RPCA_38", 2720], ["RPCA_14", 1220], ["RPCB_1Q", 19700], ["RPCB_10", 16800], ["RPCB_34", 10300], ["RPCB_12", 4850], ["RPCB_38", 2720], ["RPCB_14", 1220]])], [10, new Map([["RPCA_1Q", 24500], ["RPCA_10", 21000], ["RPCA_34", 12800], ["RPCA_12", 6000], ["RPCA_38", 3400], ["RPCA_14", 1550], ["RPCB_1Q", 23400], ["RPCB_10", 20000], ["RPCB_34", 12800], ["RPCB_12", 6000], ["RPCB_38", 3400], ["RPCB_14", 1550]])], [15, new Map([["RPCA_1Q", 31200], ["RPCA_10", 26700], ["RPCA_34", 16300], ["RPCA_12", 7700], ["RPCA_38", 4300], ["RPCA_14", 2000], ["RPCB_1Q", 24000], ["RPCB_10", 20000], ["RPCB_34", 16300], ["RPCB_12", 7700], ["RPCB_38", 4300], ["RPCB_14", 2000]])], [20, new Map([["RPCA_1Q", 36400], ["RPCA_10", 31200], ["RPCA_34", 19000], ["RPCA_12", 9000], ["RPCA_38", 5000], ["RPCA_14", 2300], ["RPCB_1Q", 26000], ["RPCB_10", 20250], ["RPCB_34", 19000], ["RPCB_12", 9000], ["RPCB_38", 5000], ["RPCB_14", 2300]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 26000], ["RPCB_10", 20500], ["RPCB_34", 20500], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 26000], ["RPCB_10", 21600], ["RPCB_34", 21600], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 23000], ["RPCB_34", 23000], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 23500], ["RPCB_34", 23500], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 24000], ["RPCB_34", 24000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 24000], ["RPCB_12", 24000], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 24000], ["RPCB_12", 24000], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 24000], ["RPCB_12", 24000], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 24000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [0.5, new Map([[2, new Map([["RPCA_1Q", 8500], ["RPCA_10", 7300], ["RPCA_34", 4450], ["RPCA_12", 2000], ["RPCA_38", 1150], ["RPCA_14", 510], ["RPCB_1Q", 8500], ["RPCB_10", 7300], ["RPCB_34", 4450], ["RPCB_12", 2000], ["RPCB_38", 1150], ["RPCB_14", 510]])], [3, new Map([["RPCA_1Q", 11200], ["RPCA_10", 9800], ["RPCA_34", 5900], ["RPCA_12", 2750], ["RPCA_38", 1540], ["RPCA_14", 700], ["RPCB_1Q", 11200], ["RPCB_10", 9800], ["RPCB_34", 5900], ["RPCB_12", 2750], ["RPCB_38", 1540], ["RPCB_14", 700]])], [5, new Map([["RPCA_1Q", 15600], ["RPCA_10", 13500], ["RPCA_34", 8200], ["RPCA_12", 3850], ["RPCA_38", 2140], ["RPCA_14", 960], ["RPCB_1Q", 15600], ["RPCB_10", 13500], ["RPCB_34", 8200], ["RPCB_12", 3850], ["RPCB_38", 2140], ["RPCB_14", 960]])], [7, new Map([["RPCA_1Q", 19500], ["RPCA_10", 16500], ["RPCA_34", 10100], ["RPCA_12", 4750], ["RPCA_38", 2650], ["RPCA_14", 1210], ["RPCB_1Q", 19500], ["RPCB_10", 16500], ["RPCB_34", 10100], ["RPCB_12", 4750], ["RPCB_38", 2650], ["RPCB_14", 1210]])], [10, new Map([["RPCA_1Q", 23700], ["RPCA_10", 20400], ["RPCA_34", 12500], ["RPCA_12", 5900], ["RPCA_38", 3250], ["RPCA_14", 1470], ["RPCB_1Q", 23700], ["RPCB_10", 20400], ["RPCB_34", 12500], ["RPCB_12", 5900], ["RPCB_38", 3250], ["RPCB_14", 1470]])], [15, new Map([["RPCA_1Q", 31200], ["RPCA_10", 26700], ["RPCA_34", 16300], ["RPCA_12", 7700], ["RPCA_38", 4300], ["RPCA_14", 2000], ["RPCB_1Q", 28000], ["RPCB_10", 21600], ["RPCB_34", 16300], ["RPCB_12", 7700], ["RPCB_38", 4300], ["RPCB_14", 2000]])], [20, new Map([["RPCA_1Q", 36400], ["RPCA_10", 31200], ["RPCA_34", 19000], ["RPCA_12", 9000], ["RPCA_38", 5000], ["RPCA_14", 2300], ["RPCB_1Q", 30000], ["RPCB_10", 21800], ["RPCB_34", 19000], ["RPCB_12", 9000], ["RPCB_38", 5000], ["RPCB_14", 2300]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 30000], ["RPCB_10", 22000], ["RPCB_34", 21000], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 30000], ["RPCB_10", 23500], ["RPCB_34", 22500], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 26000], ["RPCB_34", 26000], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 27000], ["RPCB_34", 27000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 28000], ["RPCB_34", 28000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 29000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 29000], ["RPCB_12", 27000], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 29000], ["RPCB_12", 27000], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 27000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [1, new Map([[3, new Map([["RPCA_1Q", 10000], ["RPCA_10", 8600], ["RPCA_34", 5250], ["RPCA_12", 2450], ["RPCA_38", 1380], ["RPCA_14", 600], ["RPCB_1Q", 10000], ["RPCB_10", 8600], ["RPCB_34", 5250], ["RPCB_12", 2450], ["RPCB_38", 1380], ["RPCB_14", 600]])], [5, new Map([["RPCA_1Q", 15000], ["RPCA_10", 12900], ["RPCA_34", 7850], ["RPCA_12", 3750], ["RPCA_38", 2100], ["RPCA_14", 910], ["RPCB_1Q", 15000], ["RPCB_10", 12900], ["RPCB_34", 7850], ["RPCB_12", 3750], ["RPCB_38", 2100], ["RPCB_14", 910]])], [7, new Map([["RPCA_1Q", 19000], ["RPCA_10", 16200], ["RPCA_34", 9850], ["RPCA_12", 4650], ["RPCA_38", 2600], ["RPCA_14", 1160], ["RPCB_1Q", 19000], ["RPCB_10", 16200], ["RPCB_34", 9850], ["RPCB_12", 4650], ["RPCB_38", 2600], ["RPCB_14", 1160]])], [10, new Map([["RPCA_1Q", 23500], ["RPCA_10", 20200], ["RPCA_34", 12350], ["RPCA_12", 5800], ["RPCA_38", 3220], ["RPCA_14", 1420], ["RPCB_1Q", 23500], ["RPCB_10", 20200], ["RPCB_34", 12350], ["RPCB_12", 5800], ["RPCB_38", 3220], ["RPCB_14", 1420]])], [15, new Map([["RPCA_1Q", 31200], ["RPCA_10", 26700], ["RPCA_34", 16300], ["RPCA_12", 7700], ["RPCA_38", 4300], ["RPCA_14", 2000], ["RPCB_1Q", 30000], ["RPCB_10", 24000], ["RPCB_34", 16300], ["RPCB_12", 7700], ["RPCB_38", 4300], ["RPCB_14", 2000]])], [20, new Map([["RPCA_1Q", 36400], ["RPCA_10", 31200], ["RPCA_34", 19000], ["RPCA_12", 9000], ["RPCA_38", 5000], ["RPCA_14", 2300], ["RPCB_1Q", 35000], ["RPCB_10", 28000], ["RPCB_34", 19000], ["RPCB_12", 9000], ["RPCB_38", 5000], ["RPCB_14", 2300]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 35000], ["RPCB_10", 28500], ["RPCB_34", 21800], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 35000], ["RPCB_10", 29500], ["RPCB_34", 23500], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 30000], ["RPCB_34", 28500], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 30000], ["RPCB_34", 30000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 30000], ["RPCB_34", 30000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 30000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 30000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 30000], ["RPCB_12", 30000], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 30000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [2, new Map([[5, new Map([["RPCA_1Q", 12900], ["RPCA_10", 11000], ["RPCA_34", 6750], ["RPCA_12", 3200], ["RPCA_38", 1760], ["RPCA_14", 800], ["RPCB_1Q", 12900], ["RPCB_10", 11000], ["RPCB_34", 6750], ["RPCB_12", 3200], ["RPCB_38", 1760], ["RPCB_14", 800]])], [7, new Map([["RPCA_1Q", 17300], ["RPCA_10", 14800], ["RPCA_34", 9100], ["RPCA_12", 4300], ["RPCA_38", 2350], ["RPCA_14", 1090], ["RPCB_1Q", 17300], ["RPCB_10", 14800], ["RPCB_34", 9100], ["RPCB_12", 4300], ["RPCB_38", 2350], ["RPCB_14", 1090]])], [10, new Map([["RPCA_1Q", 22600], ["RPCA_10", 19700], ["RPCA_34", 11850], ["RPCA_12", 5600], ["RPCA_38", 3100], ["RPCA_14", 1410], ["RPCB_1Q", 22600], ["RPCB_10", 19700], ["RPCB_34", 11850], ["RPCB_12", 5600], ["RPCB_38", 3100], ["RPCB_14", 1410]])], [15, new Map([["RPCA_1Q", 30400], ["RPCA_10", 26000], ["RPCA_34", 15950], ["RPCA_12", 7500], ["RPCA_38", 4200], ["RPCA_14", 1880], ["RPCB_1Q", 30400], ["RPCB_10", 26000], ["RPCB_34", 15950], ["RPCB_12", 7500], ["RPCB_38", 4200], ["RPCB_14", 1880]])], [20, new Map([["RPCA_1Q", 36400], ["RPCA_10", 31200], ["RPCA_34", 19000], ["RPCA_12", 9000], ["RPCA_38", 5000], ["RPCA_14", 2300], ["RPCB_1Q", 35600], ["RPCB_10", 29000], ["RPCB_34", 19000], ["RPCB_12", 9000], ["RPCB_38", 5000], ["RPCB_14", 2300]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 38000], ["RPCB_10", 30000], ["RPCB_34", 21800], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 39000], ["RPCB_10", 32000], ["RPCB_34", 24500], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 33000], ["RPCB_34", 29500], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 33000], ["RPCB_34", 33000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 33000], ["RPCB_34", 33000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 35000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 35000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 35000], ["RPCB_12", 35000], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 35000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [3, new Map([[5, new Map([["RPCA_1Q", 10600], ["RPCA_10", 9100], ["RPCA_34", 5550], ["RPCA_12", 2600], ["RPCA_38", 1450], ["RPCA_14", 640], ["RPCB_1Q", 10600], ["RPCB_10", 9100], ["RPCB_34", 5550], ["RPCB_12", 2600], ["RPCB_38", 1450], ["RPCB_14", 640]])], [7, new Map([["RPCA_1Q", 15400], ["RPCA_10", 13200], ["RPCA_34", 8050], ["RPCA_12", 3800], ["RPCA_38", 2100], ["RPCA_14", 970], ["RPCB_1Q", 15400], ["RPCB_10", 13200], ["RPCB_34", 8050], ["RPCB_12", 3800], ["RPCB_38", 2100], ["RPCB_14", 970]])], [10, new Map([["RPCA_1Q", 21500], ["RPCA_10", 18500], ["RPCA_34", 11350], ["RPCA_12", 5350], ["RPCA_38", 3000], ["RPCA_14", 1350], ["RPCB_1Q", 21500], ["RPCB_10", 18500], ["RPCB_34", 11350], ["RPCB_12", 5350], ["RPCB_38", 3000], ["RPCB_14", 1350]])], [15, new Map([["RPCA_1Q", 29500], ["RPCA_10", 25400], ["RPCA_34", 15500], ["RPCA_12", 7300], ["RPCA_38", 4000], ["RPCA_14", 1840], ["RPCB_1Q", 29500], ["RPCB_10", 25400], ["RPCB_34", 15500], ["RPCB_12", 7300], ["RPCB_38", 4000], ["RPCB_14", 1840]])], [20, new Map([["RPCA_1Q", 36400], ["RPCA_10", 31200], ["RPCA_34", 19000], ["RPCA_12", 9000], ["RPCA_38", 5000], ["RPCA_14", 2300], ["RPCB_1Q", 35600], ["RPCB_10", 30000], ["RPCB_34", 19000], ["RPCB_12", 9000], ["RPCB_38", 5000], ["RPCB_14", 2300]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 41000], ["RPCB_10", 32000], ["RPCB_34", 21800], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 43000], ["RPCB_10", 34000], ["RPCB_34", 24500], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 36000], ["RPCB_34", 29500], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 36000], ["RPCB_34", 35000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 36000], ["RPCB_34", 36000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 38000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 38000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 38000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 36300], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [5, new Map([[7, new Map([["RPCA_1Q", 11200], ["RPCA_10", 9800], ["RPCA_34", 5900], ["RPCA_12", 2750], ["RPCA_38", 1550], ["RPCA_14", 680], ["RPCB_1Q", 11200], ["RPCB_10", 9800], ["RPCB_34", 5900], ["RPCB_12", 2750], ["RPCB_38", 1550], ["RPCB_14", 680]])], [10, new Map([["RPCA_1Q", 18800], ["RPCA_10", 16200], ["RPCA_34", 9850], ["RPCA_12", 4650], ["RPCA_38", 2600], ["RPCA_14", 1140], ["RPCB_1Q", 18800], ["RPCB_10", 16200], ["RPCB_34", 9850], ["RPCB_12", 4650], ["RPCB_38", 2600], ["RPCB_14", 1140]])], [15, new Map([["RPCA_1Q", 27500], ["RPCA_10", 23600], ["RPCA_34", 14500], ["RPCA_12", 6800], ["RPCA_38", 3800], ["RPCA_14", 1700], ["RPCB_1Q", 27500], ["RPCB_10", 23600], ["RPCB_34", 14500], ["RPCB_12", 6800], ["RPCB_38", 3800], ["RPCB_14", 1700]])], [20, new Map([["RPCA_1Q", 35600], ["RPCA_10", 30500], ["RPCA_34", 18700], ["RPCA_12", 8800], ["RPCA_38", 4900], ["RPCA_14", 2150], ["RPCB_1Q", 35600], ["RPCB_10", 30500], ["RPCB_34", 18700], ["RPCB_12", 8800], ["RPCB_38", 4900], ["RPCB_14", 2150]])], [25, new Map([["RPCA_1Q", 41600], ["RPCA_10", 35700], ["RPCA_34", 21800], ["RPCA_12", 10300], ["RPCA_38", 5800], ["RPCA_14", 2600], ["RPCB_1Q", 41000], ["RPCB_10", 34000], ["RPCB_34", 21800], ["RPCB_12", 10300], ["RPCB_38", 5800], ["RPCB_14", 2600]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 47000], ["RPCB_10", 36000], ["RPCB_34", 24500], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 38500], ["RPCB_34", 29500], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 39000], ["RPCB_34", 35000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 40000], ["RPCB_34", 40000], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 41000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 41000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 41000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [7, new Map([[10, new Map([["RPCA_1Q", 14500], ["RPCA_10", 12400], ["RPCA_34", 7550], ["RPCA_12", 3550], ["RPCA_38", 2000], ["RPCA_14", 860], ["RPCB_1Q", 14500], ["RPCB_10", 12400], ["RPCB_34", 7550], ["RPCB_12", 3550], ["RPCB_38", 2000], ["RPCB_14", 860]])], [15, new Map([["RPCA_1Q", 25600], ["RPCA_10", 22000], ["RPCA_34", 13400], ["RPCA_12", 6300], ["RPCA_38", 3550], ["RPCA_14", 1580], ["RPCB_1Q", 25600], ["RPCB_10", 22000], ["RPCB_34", 13400], ["RPCB_12", 6300], ["RPCB_38", 3550], ["RPCB_14", 1580]])], [20, new Map([["RPCA_1Q", 33300], ["RPCA_10", 28600], ["RPCA_34", 17500], ["RPCA_12", 8300], ["RPCA_38", 4600], ["RPCA_14", 2100], ["RPCB_1Q", 33300], ["RPCB_10", 28600], ["RPCB_34", 17500], ["RPCB_12", 8300], ["RPCB_38", 4600], ["RPCB_14", 2100]])], [25, new Map([["RPCA_1Q", 41000], ["RPCA_10", 35000], ["RPCA_34", 21400], ["RPCA_12", 10000], ["RPCA_38", 5650], ["RPCA_14", 2500], ["RPCB_1Q", 41000], ["RPCB_10", 35000], ["RPCB_34", 21400], ["RPCB_12", 10000], ["RPCB_38", 5650], ["RPCB_14", 2500]])], [30, new Map([["RPCA_1Q", 47000], ["RPCA_10", 40200], ["RPCA_34", 24500], ["RPCA_12", 11600], ["RPCA_38", 6500], ["RPCA_14", 2950], ["RPCB_1Q", 47000], ["RPCB_10", 38000], ["RPCB_34", 24500], ["RPCB_12", 11600], ["RPCB_38", 6500], ["RPCB_14", 2950]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 41000], ["RPCB_34", 29500], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 43000], ["RPCB_34", 35000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 45000], ["RPCB_34", 40500], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 45000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 45000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 45000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [10, new Map([[15, new Map([["RPCA_1Q", 20400], ["RPCA_10", 17500], ["RPCA_34", 10700], ["RPCA_12", 5000], ["RPCA_38", 2850], ["RPCA_14", 1230], ["RPCB_1Q", 20400], ["RPCB_10", 17500], ["RPCB_34", 10700], ["RPCB_12", 5000], ["RPCB_38", 2850], ["RPCB_14", 1230]])], [20, new Map([["RPCA_1Q", 30500], ["RPCA_10", 26200], ["RPCA_34", 16000], ["RPCA_12", 7600], ["RPCA_38", 4250], ["RPCA_14", 1850], ["RPCB_1Q", 30500], ["RPCB_10", 26200], ["RPCB_34", 16000], ["RPCB_12", 7600], ["RPCB_38", 4250], ["RPCB_14", 1850]])], [25, new Map([["RPCA_1Q", 38300], ["RPCA_10", 32700], ["RPCA_34", 20000], ["RPCA_12", 9450], ["RPCA_38", 5300], ["RPCA_14", 2350], ["RPCB_1Q", 38300], ["RPCB_10", 32700], ["RPCB_34", 20000], ["RPCB_12", 9450], ["RPCB_38", 5300], ["RPCB_14", 2350]])], [30, new Map([["RPCA_1Q", 46000], ["RPCA_10", 39400], ["RPCA_34", 24000], ["RPCA_12", 11300], ["RPCA_38", 6400], ["RPCA_14", 2850], ["RPCB_1Q", 46000], ["RPCB_10", 39400], ["RPCB_34", 24500], ["RPCB_12", 11300], ["RPCB_38", 6400], ["RPCB_14", 2850]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 49200], ["RPCA_34", 30000], ["RPCA_12", 14200], ["RPCA_38", 7950], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 46000], ["RPCB_34", 29500], ["RPCB_12", 14200], ["RPCB_38", 7950], ["RPCB_14", 3600]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 48000], ["RPCB_34", 35000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 50000], ["RPCB_34", 40500], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 48000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 50000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 60000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [15, new Map([[20, new Map([["RPCA_1Q", 22300], ["RPCA_10", 19100], ["RPCA_34", 11700], ["RPCA_12", 5500], ["RPCA_38", 3100], ["RPCA_14", 1350], ["RPCB_1Q", 22300], ["RPCB_10", 19100], ["RPCB_34", 11700], ["RPCB_12", 5500], ["RPCB_38", 3100], ["RPCB_14", 1350]])], [25, new Map([["RPCA_1Q", 32700], ["RPCA_10", 28200], ["RPCA_34", 17200], ["RPCA_12", 8200], ["RPCA_38", 4750], ["RPCA_14", 2000], ["RPCB_1Q", 32700], ["RPCB_10", 28200], ["RPCB_34", 17200], ["RPCB_12", 8200], ["RPCB_38", 4750], ["RPCB_14", 2000]])], [30, new Map([["RPCA_1Q", 41500], ["RPCA_10", 35500], ["RPCA_34", 21700], ["RPCA_12", 10000], ["RPCA_38", 5750], ["RPCA_14", 2550], ["RPCB_1Q", 41500], ["RPCB_10", 35500], ["RPCB_34", 21700], ["RPCB_12", 10000], ["RPCB_38", 5750], ["RPCB_14", 2550]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 48500], ["RPCA_34", 29500], ["RPCA_12", 14000], ["RPCA_38", 7800], ["RPCA_14", 3500], ["RPCB_1Q", null], ["RPCB_10", 48500], ["RPCB_34", 29500], ["RPCB_12", 14000], ["RPCB_38", 7800], ["RPCB_14", 3500]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 58200], ["RPCA_34", 35500], ["RPCA_12", 16800], ["RPCA_38", 9400], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 52000], ["RPCB_34", 35000], ["RPCB_12", 16800], ["RPCB_38", 9400], ["RPCB_14", 4300]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 52000], ["RPCB_34", 40500], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 50000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 53000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 64000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [20, new Map([[25, new Map([["RPCA_1Q", 23700], ["RPCA_10", 20200], ["RPCA_34", 12400], ["RPCA_12", 5900], ["RPCA_38", 3300], ["RPCA_14", 1450], ["RPCB_1Q", 23700], ["RPCB_10", 20200], ["RPCB_34", 12400], ["RPCB_12", 5900], ["RPCB_38", 3300], ["RPCB_14", 1450]])], [30, new Map([["RPCA_1Q", 35400], ["RPCA_10", 30400], ["RPCA_34", 18500], ["RPCA_12", 8750], ["RPCA_38", 4900], ["RPCA_14", 2180], ["RPCB_1Q", 35400], ["RPCB_10", 30400], ["RPCB_34", 18500], ["RPCB_12", 8750], ["RPCB_38", 4900], ["RPCB_14", 2180]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 44500], ["RPCA_34", 27200], ["RPCA_12", 12800], ["RPCA_38", 7200], ["RPCA_14", 3200], ["RPCB_1Q", null], ["RPCB_10", 44500], ["RPCB_34", 27200], ["RPCB_12", 12800], ["RPCB_38", 7200], ["RPCB_14", 3200]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 57400], ["RPCA_34", 35000], ["RPCA_12", 16500], ["RPCA_38", 9250], ["RPCA_14", 4150], ["RPCB_1Q", null], ["RPCB_10", 57400], ["RPCB_34", 35000], ["RPCB_12", 16500], ["RPCB_38", 9250], ["RPCB_14", 4150]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 67200], ["RPCA_34", 41000], ["RPCA_12", 19400], ["RPCA_38", 10900], ["RPCA_14", 4900], ["RPCB_1Q", null], ["RPCB_10", 60000], ["RPCB_34", 40500], ["RPCB_12", 19400], ["RPCB_38", 10900], ["RPCB_14", 4900]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 52000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 56000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 68000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [25, new Map([[30, new Map([["RPCA_1Q", 25400], ["RPCA_10", 21600], ["RPCA_34", 13200], ["RPCA_12", 6300], ["RPCA_38", 3600], ["RPCA_14", 1550], ["RPCB_1Q", 25400], ["RPCB_10", 21600], ["RPCB_34", 13200], ["RPCB_12", 6300], ["RPCB_38", 3600], ["RPCB_14", 1550]])], [40, new Map([["RPCA_1Q", null], ["RPCA_10", 40500], ["RPCA_34", 24500], ["RPCA_12", 11700], ["RPCA_38", 6600], ["RPCA_14", 3000], ["RPCB_1Q", null], ["RPCB_10", 40500], ["RPCB_34", 24500], ["RPCB_12", 11700], ["RPCB_38", 6600], ["RPCB_14", 3000]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 53200], ["RPCA_34", 32500], ["RPCA_12", 15400], ["RPCA_38", 8600], ["RPCA_14", 3850], ["RPCB_1Q", null], ["RPCB_10", 53200], ["RPCB_34", 32500], ["RPCB_12", 15400], ["RPCB_38", 8600], ["RPCB_14", 3850]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 66000], ["RPCA_34", 40500], ["RPCA_12", 19000], ["RPCA_38", 10500], ["RPCA_14", 4850], ["RPCB_1Q", null], ["RPCB_10", 66000], ["RPCB_34", 40500], ["RPCB_12", 19000], ["RPCB_38", 10500], ["RPCB_14", 4850]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 52000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 56000], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 72000], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [30, new Map([[40, new Map([["RPCA_1Q", null], ["RPCA_10", 33400], ["RPCA_34", 20400], ["RPCA_12", 9800], ["RPCA_38", 5400], ["RPCA_14", 2420], ["RPCB_1Q", null], ["RPCB_10", 33400], ["RPCB_34", 20400], ["RPCB_12", 9800], ["RPCB_38", 5400], ["RPCB_14", 2420]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 50000], ["RPCA_34", 30500], ["RPCA_12", 14500], ["RPCA_38", 8100], ["RPCA_14", 3600], ["RPCB_1Q", null], ["RPCB_10", 50000], ["RPCB_34", 30500], ["RPCB_12", 14500], ["RPCB_38", 8100], ["RPCB_14", 3600]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 63500], ["RPCA_34", 39000], ["RPCA_12", 18500], ["RPCA_38", 10000], ["RPCA_14", 4650], ["RPCB_1Q", null], ["RPCB_10", 63500], ["RPCB_34", 39000], ["RPCB_12", 18500], ["RPCB_38", 10000], ["RPCB_14", 4650]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 52000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 62500], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 76500], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])], [35, new Map([[40, new Map([["RPCA_1Q", null], ["RPCA_10", 24300], ["RPCA_34", 14800], ["RPCA_12", 7000], ["RPCA_38", 3900], ["RPCA_14", 1720], ["RPCB_1Q", null], ["RPCB_10", 24300], ["RPCB_34", 14800], ["RPCB_12", 7000], ["RPCB_38", 3900], ["RPCB_14", 1720]])], [50, new Map([["RPCA_1Q", null], ["RPCA_10", 44600], ["RPCA_34", 27100], ["RPCA_12", 13000], ["RPCA_38", 7200], ["RPCA_14", 3200], ["RPCB_1Q", null], ["RPCB_10", 44600], ["RPCB_34", 27100], ["RPCB_12", 13000], ["RPCB_38", 7200], ["RPCB_14", 3200]])], [60, new Map([["RPCA_1Q", null], ["RPCA_10", 59500], ["RPCA_34", 36400], ["RPCA_12", 17000], ["RPCA_38", 9800], ["RPCA_14", 4300], ["RPCB_1Q", null], ["RPCB_10", 59500], ["RPCB_34", 36400], ["RPCB_12", 17000], ["RPCB_38", 9800], ["RPCB_14", 4300]])], [80, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 52000], ["RPCA_12", 24600], ["RPCA_38", 13800], ["RPCA_14", 6250], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 52000], ["RPCB_12", 24600], ["RPCB_38", 13800], ["RPCB_14", 6250]])], [100, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 62500], ["RPCA_12", 29800], ["RPCA_38", 16700], ["RPCA_14", 7600], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 62500], ["RPCB_12", 28500], ["RPCB_38", 16700], ["RPCB_14", 7600]])], [125, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", 76500], ["RPCA_12", 36300], ["RPCA_38", 20400], ["RPCA_14", 9200], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", 76500], ["RPCB_12", 36300], ["RPCB_38", 20400], ["RPCB_14", 9200]])], [150, new Map([["RPCA_1Q", null], ["RPCA_10", null], ["RPCA_34", null], ["RPCA_12", 41000], ["RPCA_38", 23000], ["RPCA_14", 10500], ["RPCB_1Q", null], ["RPCB_10", null], ["RPCB_34", null], ["RPCB_12", 41000], ["RPCB_38", 23000], ["RPCB_14", 10500]])]])]]);
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
function will_work(cap, reg, orifice_max) {
  let $t7;
  if ($truthy(($eq(cap, "N/A")))) {
    return "No";
  } else {
    if ($truthy((($truthy(($t7 = ((cap >= (flow_rate * oversizeby)))))) ? (((orifice_max >= maop))) : $t7))) {
      return "Yes";
    } else {
      return "No";
    }
  }
}
function orifice_typeRPC(reg) {
  let suf;
  suf = $slice(reg, (-2), null);
  if ($truthy(($eq(suf, "14")))) {
    return "1/4\"";
  } else {
    if ($truthy(($eq(suf, "38")))) {
      return "3/8\"";
    } else {
      if ($truthy(($eq(suf, "12")))) {
        return "1/2\"";
      } else {
        if ($truthy(($eq(suf, "34")))) {
          return "3/4\"";
        } else {
          if ($truthy(($eq(suf, "10")))) {
            return "1\"";
          } else {
            if ($truthy(($eq(suf, "1Q")))) {
              return "1-1/4\"";
            }
          }
        }
      }
    }
  }
}
function orifice_maxRPC(reg) {
  let suf, $t8, $t9;
  suf = $slice(reg, (-2), null);
  if ($truthy((($truthy(($t9 = ($eq(suf, "14"))))) ? $t9 : ((($truthy(($t8 = ($eq(suf, "38"))))) ? $t8 : (($eq(suf, "12")))))))) {
    return 150;
  } else {
    if ($truthy(($eq(suf, "34")))) {
      return 125;
    } else {
      if ($truthy(($eq(suf, "10")))) {
        return 60;
      } else {
        if ($truthy(($eq(suf, "1Q")))) {
          return 30;
        }
      }
    }
  }
}
function spring_RPC(op) {
  let $t10;
  if ($truthy((($truthy(($t10 = ((op < (6.5 / 28)))))) ? (((op >= (3.5 / 28)))) : $t10))) {
    return new Map([["color", "Red"], ["range", "(3.5\" - 6.5\" wc)"]]);
  } else {
    if ($truthy(((op < (8.5 / 28))))) {
      return new Map([["color", "Blue"], ["range", "(5\" - 8.5\" wc)"]]);
    } else {
      if ($truthy(((op < (14 / 28))))) {
        return new Map([["color", "Green"], ["range", "(6\" - 14\" wc)"]]);
      } else {
        if ($truthy(((op < 1)))) {
          return new Map([["color", "Orange"], ["range", "(12\" - 28\" wc)"]]);
        } else {
          if ($truthy(((op < 2)))) {
            return new Map([["color", "Black"], ["range", "(1 - 2 psi)"]]);
          } else {
            if ($truthy(((op < 3.5)))) {
              return new Map([["color", "White"], ["range", "(1 - 5 psi)"]]);
            } else {
              if ($truthy(((op < 5)))) {
                return new Map([["color", "Aluminum"], ["range", "(3.5 - 5 psi)"]]);
              } else {
                if ($truthy(((op < 15)))) {
                  return new Map([["color", "Gray"], ["range", "(3 - 15 psi)"]]);
                } else {
                  if ($truthy(((op <= 35)))) {
                    return new Map([["color", "Brown"], ["range", "(10 - 35 psi)"]]);
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
function body_size_minRPC(body) {
  let body_order, candidate, maxflow;
  if ($truthy(((outlet_input < (7 / 28))))) {
    maxflow = new Map([["1-1/4\"", 9200], ["1-1/2\"", 14200], ["2\"", 30000]]);
  } else {
    if ($truthy(((outlet_input < (14 / 28))))) {
      maxflow = new Map([["1-1/4\"", 14200], ["1-1/2\"", 21000], ["2\"", 41600]]);
    } else {
      if ($truthy(((outlet_input < 1)))) {
        maxflow = new Map([["1-1/4\"", 19400], ["1-1/2\"", 29800], ["2\"", 58200]]);
      } else {
        if ($truthy(((outlet_input < 2)))) {
          maxflow = new Map([["1-1/4\"", 24600], ["1-1/2\"", 41600], ["2\"", 76500]]);
        } else {
          if ($truthy(((outlet_input < 3)))) {
            maxflow = new Map([["1-1/4\"", 36300], ["1-1/2\"", 58200], ["2\"", 76500]]);
          } else {
            if ($truthy(((outlet_input < 5)))) {
              maxflow = new Map([["1-1/4\"", 41000], ["1-1/2\"", 76500], ["2\"", 76500]]);
            } else {
              if ($truthy(((outlet_input < 7)))) {
                maxflow = new Map([["1-1/4\"", 62500], ["1-1/2\"", 76500], ["2\"", 3007650000]]);
              } else {
                maxflow = new Map([["1-1/4\"", 76500], ["1-1/2\"", 76500], ["2\"", 76500]]);
              }
            }
          }
        }
      }
    }
  }
  body_order = ["1-1/4\"", "1-1/2\"", "2\""];
  for (const candidate of $iter($slice(body_order, $index(body_order, body), null))) {
    if ($truthy(((flow_rate <= $get(maxflow, candidate))))) {
      return candidate;
    }
  }
  return "3\"";
}
function gen_matchRPC(result, opp) {
  let body, cap, match, model, model_labelsRPC, monset, ordered_prefixes, orifice, orifice_orderRPC, prefix, reg, $t11, $t12;
  match = null;
  model_labelsRPC = new Map([["RPC", "243-RPC"], ["RPCA", "243-RPC-A"], ["RPCB", "243-RPC-B"]]);
  if ($truthy(($eq(model_input, "243-RPC-B")))) {
    ordered_prefixes = ["RPCB", "RPCA"];
  } else {
    ordered_prefixes = ["RPCA", "RPCB"];
  }
  orifice_orderRPC = ["14", "38", "12", "34", "10", "1Q"];
  monset = 0;
  if ($truthy(($eq(opp, "Monitor")))) {
    if ($truthy(((outlet_input < 1)))) {
      monset = $add(outlet_input, 0.5);
    } else {
      if ($truthy(($eq(outlet_input, 1)))) {
        monset = 2;
      } else {
        if ($truthy(((outlet_input <= 2)))) {
          monset = $add(outlet_input, 1.5);
        } else {
          if ($truthy(((outlet_input <= 5)))) {
            monset = $add(outlet_input, 2);
          } else {
            if ($truthy(((outlet_input <= 32)))) {
              monset = $add(outlet_input, 3);
            } else {
              monset = 35;
            }
          }
        }
      }
    }
  }
  if ($truthy(($in("irv_input", $GLOBALS)))) {
    if ($truthy((($truthy(($t11 = ((!$eq(irv_input, 0)))))) ? (((monset > irv_input))) : $t11))) {
      monset = irv_input;
    }
  }
  for (const prefix of $iter(ordered_prefixes)) {
    for (const orifice of $iter(orifice_orderRPC)) {
      reg = `${$str(prefix)}_${$str(orifice)}`;
      if ($truthy(($in(reg, result)))) {
        cap = $get(result, reg);
        if ($truthy(($eq(will_work(cap, reg, orifice_maxRPC(reg)), "Yes")))) {
          if ($truthy(($eq(model_input, "243-RPC-B")))) {
            model = $get(model_labelsRPC, prefix);
          } else {
            model = $dget(model_labelsRPC, model_input, model_input);
          }
          if ($truthy((($truthy(($t12 = ($eq(model, "243-RPC-B"))))) ? $t12 : (($eq(pipesize_input, 0)))))) {
            body = "2\"";
          } else {
            body = pipesize_input;
          }
          match = new Map([["reg", reg], ["model", model], ["diap", null], ["body", body], ["orifice", orifice_typeRPC(reg)], ["seat", null], ["color", $get(spring_RPC(outlet_input), "color")], ["range", $get(spring_RPC(outlet_input), "range")], ["capacity", cap], ["opp", opp], ["mon_color", ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_RPC(monset), "color")) : (null))], ["mon_range", ($truthy(($eq(opp, "Monitor"))) ? ($get(spring_RPC(monset), "range")) : (null))]]);
          return match;
        }
      }
    }
  }
}
function run_regulator_selectionRPC(inlet, outlet, opp) {
  let apply, match, monitor, result, warning;
  warning = null;
  if ($truthy(($eq(opp, "Monitor")))) {
    monitor = true;
    warning = "Sized for worker/monitor setup";
  } else {
    monitor = false;
    warning = null;
  }
  result = interpolate_capacity(dataRPC, inlet, outlet, monitor, false);
  if ($truthy(((typeof (result) === 'string')))) {
    warning = result;
    result = null;
    match = null;
    apply = false;
    return [result, match, apply, warning];
  }
  match = gen_matchRPC(result, opp);
  if ($truthy(match)) {
    apply = true;
  } else {
    apply = false;
  }
  return [result, match, apply, warning];
}
function hsc_pncRPC(match) {
  let body, body_map, control, model, monitor_spring, opp, orifice, orifice_map, spring, spring_map;
  body_map = new Map([["1-1/4\"", "1-1/4SCD"], ["1-1/2\"", "1-1/2SCD"], ["2\"", "2SCD"]]);
  orifice_map = new Map([["1/4\"", "12"], ["3/8\"", "14"], ["1/2\"", "15"], ["3/4\"", "18"], ["1\"", "20"], ["1-1/4\"", "21"]]);
  spring_map = new Map([["Red", "10"], ["Blue", "11"], ["Green", "12"], ["Orange", "13"], ["Black", "14"], ["White", "25"], ["Aluminum", "24"], ["Gray", "27"], ["Brown", "22"]]);
  model = $get(match, "model");
  body = $dget(body_map, $get(match, "body"), null);
  orifice = $dget(orifice_map, $get(match, "orifice"), null);
  spring = $dget(spring_map, $get(match, "color"), null);
  opp = $get(match, "opp");
  monitor_spring = $dget(spring_map, $get(match, "mon_color"), null);
  if ($truthy(($eq(model, "243-RPC-B")))) {
    control = "INT";
  } else {
    control = "EXT";
  }
  if ($truthy(($eq(opp, "Monitor")))) {
    return [`R.${$str(model)}.${$str(body)}.${$str(control)}.${$str(orifice)}.STD.${$str(spring)}.ALU`, `R.243-RPC.${$str(body)}.EXT.${$str(orifice)}.STD.${$str(monitor_spring)}.ALU`];
  } else {
    return `R.${$str(model)}.${$str(body)}.${$str(control)}.${$str(orifice)}.STD.${$str(spring)}.ALU`;
  }
}


// ============================================================================
//  Wrapper around the transpiled Model RPC algorithm.
//
//  Everything the Streamlit front end used to do around
//  run_regulator_selectionRPC(): unit conversion, validation, oversize maths,
//  the three capacity tables and result formatting.
//
//  This file is hand-written, NOT generated. Its Python twin is reference.py
//  in this same folder, and CI proves the two agree on every input it tests,
//  so this cannot silently drift from the algorithm's expectations.
//
//  build/build.py exposes this as USGSizing.sizeModelRPC(input), per the
//  "method" field in tool.json.
// ============================================================================

var PIPE_OPTIONS = ["N/A", '1-1/4"', '1-1/2"', '2"'];

// This is the only tool where the user can pin a specific model variant. The
// labels are what the form shows; the values are what the algorithm expects.
var MODEL_OPTIONS = ["N/A (any)", "243-RPC", "243-RPC-A", "243-RPC-B"];
var MODEL_MAP = {
  "N/A (any)": "RPC",
  "243-RPC": "243-RPC",
  "243-RPC-A": "243-RPC-A",
  "243-RPC-B": "243-RPC-B"
};
var INLET_UNITS = ["psi", "bar", "kPa"];
var OUTLET_UNITS = ["psi", "in wc", "oz", "bar", "kPa"];
var FLOW_UNITS = ["CFH", "CMH", "BTUH"];
var GAS_TYPES = ["Natural Gas", "Propane", "Other"];

// The two table groups, and the register prefix that identifies each in the
// algorithm's result map.
var BODY_SIZES = [
  ["243-RPC or 243-RPC-A", "RPCA"],
  ["243-RPC-B", "RPCB"]
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
    model: "N/A (any)",
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

  var model_raw = p.model;
  var model_input = MODEL_MAP[model_raw] || "RPC";

  // ---- overpressure protection ----
  // The RPC offers monitor protection only - there is no IRV option.
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
  if (inlet_psi > 0 && (inlet_psi > 150 || inlet_psi < 2)) {
    errors.push("Inlet pressure must be between 2 and 150 psi.");
  }
  if (outlet_psi > 0 && (outlet_psi < 3.5 / 28 || outlet_psi > 35)) {
    errors.push("Outlet pressure must be between 3.5\" wc and 35 psi.");
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
    model_input: model_input,
    pipesize_input: pipesize_input,
    opp_type: opp_type,
    oversizeby: oversizeby,
    oversize_percent: oversize_percent,
    gastypemult: gastypemult,
    pload: pload,
    Patm: Patm,
    resultRPC: new Map()
  });

  var r;
  try {
    r = run_regulator_selectionRPC(inlet_psi, outlet_psi, opp_type);
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG RPC sizing algorithm error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }

  var result = r[0], match = r[1], apply = r[2], warning = r[3];

  // The tables read the algorithm's result map, so publish it back the way the
  // Streamlit app did before building them.
  $setGlobal('resultRPC', result);

  var warnings = $truthy(warning) ? [warning] : [];

  // No result map at all means the algorithm stopped early; there is nothing
  // to tabulate, so report and return.
  if (!$truthy(apply) && (result === null || result === undefined)) {
    return {
      ok: true,
      selected: false,
      errors: [],
      warnings: warnings,
      message: "Model RPC will not work for this application.",
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
    message: $truthy(apply) ? "Regulator selected!" : "Model RPC will not work for this application."
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
    var bodyVal = mget('body');
    try {
      var pipeReq = body_size_minRPC(bodyVal === null || bodyVal === undefined ? '' : bodyVal);
      if ($truthy(pipeReq)) {
        out.pipe_note = "Model 243-RPC regulators have outlet pipe sizing requirements. " +
          "This regulator was sized for use with " + pipeReq + " outlet pipe. " +
          "For capacities with smaller outlet piping, see regulator brochure.";
      }
    } catch (errPipe) {
      out.pipe_note = null;
    }

    var pns = [];
    var pn = hsc_pncRPC(match);
    var pnList = Array.isArray(pn) ? pn : [pn];
    for (var q = 0; q < pnList.length; q++) if ($truthy(pnList[q])) pns.push(pnList[q]);
    out.part_numbers = pns;
  }

  // ---- the two capacity tables (mirrors build_table in the Streamlit app) ----
  // Guarded like the selection run: a spring or orifice lookup can fault on a
  // value outside its table, and that must produce a readable message rather
  // than a broken page.
  var tables = [];
  try {
    for (var b = 0; b < BODY_SIZES.length; b++) {
      var title = BODY_SIZES[b][0], prefix = BODY_SIZES[b][1];
      var rows = [];
      result.forEach(function (capacity, reg) {
        if (String(reg).indexOf(prefix) !== 0) return;
        var orifice = orifice_typeRPC(reg);
        var capStr = (typeof capacity === 'number') ? $format(capacity, ',.0f') : String(capacity);
        var works = will_work(capacity, reg, orifice_maxRPC(reg));
        rows.push([orifice, capStr, works]);
      });
      // Streamlit skipped empty frames; do the same.
      if (rows.length) {
        tables.push({
          title: title,
          headers: ["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work"],
          rows: rows
        });
      }
    }
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('USG RPC table build error', err, rawInput);
    }
    return {
      ok: false,
      errors: ["This combination could not be sized automatically. Please contact Holland Supply Company to review the selection."]
    };
  }
  out.tables = tables;

  // Shown above the tables when a monitor is in play.
  out.tables_caption = (opp_type === "Monitor") ? "Capacity reduction due to monitor shown." : null;

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
    // Always shown, including "N/A (any)", so the summary records whether a
    // model was pinned.
    kv("Desired RPC Model", model_raw),
    kv("Requested Pipe Size", pipesize_raw),
    kv("Overpressure Protection Required", p.opp_required ? "Yes" : "No")
  ];
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


  function $setGlobals(values) {
    inlet_input = values.inlet_input;
    outlet_input = values.outlet_input;
    flow_rate = values.flow_rate;
    maop = values.maop;
    model_input = values.model_input;
    pipesize_input = values.pipesize_input;
    opp_type = values.opp_type;
    oversizeby = values.oversizeby;
    oversize_percent = values.oversize_percent;
    gastypemult = values.gastypemult;
    pload = values.pload;
    Patm = values.Patm;
    resultRPC = values.resultRPC;
  }

  function $setGlobal(name, value) {
    switch (name) {
      case 'inlet_input': inlet_input = value; return;
      case 'outlet_input': outlet_input = value; return;
      case 'flow_rate': flow_rate = value; return;
      case 'maop': maop = value; return;
      case 'model_input': model_input = value; return;
      case 'pipesize_input': pipesize_input = value; return;
      case 'opp_type': opp_type = value; return;
      case 'oversizeby': oversizeby = value; return;
      case 'oversize_percent': oversize_percent = value; return;
      case 'gastypemult': gastypemult = value; return;
      case 'pload': pload = value; return;
      case 'Patm': Patm = value; return;
      case 'resultRPC': resultRPC = value; return;
    }
    throw new Error('not an injected global: ' + name);
  }

  // Join the shared namespace rather than replacing it, so several tools can
  // coexist on one page without clobbering each other.
  var ns = root.USGSizing = root.USGSizing || {};
  ns.sizeModelRPC = sizeTool;
  ns.options = ns.options || {};
  ns.options['model-rpc'] = {
    inlet_units: INLET_UNITS,
    outlet_units: OUTLET_UNITS,
    flow_units: FLOW_UNITS,
    pipe_sizes: PIPE_OPTIONS,
    gas_types: GAS_TYPES
  };
  ns.versions = ns.versions || {};
  ns.versions['model-rpc'] = {
    version: '1.1.0',
    algorithm: 'sha256:20dd5a579944',
    sources: 'sha256:1d14d1b3249a'
  };
})(typeof window !== 'undefined' ? window : this);
