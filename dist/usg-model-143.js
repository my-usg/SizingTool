/*!
 * Model 143 Sizing Tool
 * Holland Supply Company
 *
 * GENERATED FILE - DO NOT EDIT.
 * Built from tools/model-143/algorithm.py by build/build.py.
 * Edit the Python, push, and CI regenerates this file.
 *
 * tool:      model-143
 * version:   1.1.0
 * algorithm: sha256:107e1b188178
 * sources:   sha256:03726d7d4e70
 *
 * Adds to the shared namespace:
 *   USGSizing.sizeModel143(input)  -> result object
 *   USGSizing.versions['model-143']      -> build metadata
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
var $GLOBALS = new Map([["inlet_input",1],["outlet_input",1],["flow_rate",1],["maop",1],["pipesize_input",1],["opp_type",1],["irv_input",1],["oversizeby",1],["oversize_percent",1],["gastypemult",1],["pload",1],["Patm",1],["result143",1]]);
var $printBuf = [];
function $print(args) { $printBuf.push(args.map($str).join(' ')); }

var Patm, data143, flow_rate, gastypemult, inlet_input, irv_input, maop, opp_type, outlet_input, oversize_percent, oversizeby, pipesize_input, pload, result143;
data143 = new Map([[(3.5 / 28), new Map([[0.5, new Map([["R14334_58", 510], ["R14334_12", 450], ["R14334_38", 340], ["R14334_56", null], ["R14334_14", null], ["R14334_36", null], ["R14334_18", null], ["R14310_58", 520], ["R14310_12", 460], ["R14310_38", 350], ["R14310_56", null], ["R14310_14", null], ["R14310_36", null], ["R14310_18", null], ["R1431Q_58", 520], ["R1431Q_12", 460], ["R1431Q_38", 350], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", null], ["R1431Q_18", null]])], [1, new Map([["R14334_58", 530], ["R14334_12", 510], ["R14334_38", 500], ["R14334_56", 480], ["R14334_14", null], ["R14334_36", null], ["R14334_18", null], ["R14310_58", 650], ["R14310_12", 600], ["R14310_38", 550], ["R14310_56", 480], ["R14310_14", null], ["R14310_36", null], ["R14310_18", null], ["R1431Q_58", 760], ["R1431Q_12", 680], ["R1431Q_38", 550], ["R1431Q_56", 480], ["R1431Q_14", null], ["R1431Q_36", null], ["R1431Q_18", null]])], [2, new Map([["R14334_58", 600], ["R14334_12", 580], ["R14334_38", 570], ["R14334_56", 560], ["R14334_14", 530], ["R14334_36", null], ["R14334_18", null], ["R14310_58", 780], ["R14310_12", 880], ["R14310_38", 840], ["R14310_56", 700], ["R14310_14", 530], ["R14310_36", null], ["R14310_18", null], ["R1431Q_58", 1030], ["R1431Q_12", 1020], ["R1431Q_38", 840], ["R1431Q_56", 700], ["R1431Q_14", 530], ["R1431Q_36", null], ["R1431Q_18", null]])], [3, new Map([["R14334_58", 670], ["R14334_12", 650], ["R14334_38", 630], ["R14334_56", 620], ["R14334_14", 600], ["R14334_36", 420], ["R14334_18", null], ["R14310_58", 810], ["R14310_12", 920], ["R14310_38", 1000], ["R14310_56", 870], ["R14310_14", 650], ["R14310_36", 420], ["R14310_18", null], ["R1431Q_58", 1050], ["R1431Q_12", 1200], ["R1431Q_38", 1030], ["R1431Q_56", 870], ["R1431Q_14", 650], ["R1431Q_36", 420], ["R1431Q_18", null]])], [5, new Map([["R14334_58", 790], ["R14334_12", 770], ["R14334_38", 730], ["R14334_56", 720], ["R14334_14", 700], ["R14334_36", 560], ["R14334_18", 250], ["R14310_58", 970], ["R14310_12", 950], ["R14310_38", 1160], ["R14310_56", 1120], ["R14310_14", 890], ["R14310_36", 580], ["R14310_18", 250], ["R1431Q_58", 1060], ["R1431Q_12", 1490], ["R1431Q_38", 1350], ["R1431Q_56", 1180], ["R1431Q_14", 890], ["R1431Q_36", 580], ["R1431Q_18", 250]])], [7.5, new Map([["R14334_58", 900], ["R14334_12", 900], ["R14334_38", 880], ["R14334_56", 860], ["R14334_14", 840], ["R14334_36", 700], ["R14334_18", 310], ["R14310_58", 1060], ["R14310_12", 1140], ["R14310_38", 1270], ["R14310_56", 1340], ["R14310_14", 1140], ["R14310_36", 700], ["R14310_18", 310], ["R1431Q_58", 1060], ["R1431Q_12", 1140], ["R1431Q_38", 1270], ["R1431Q_56", 1340], ["R1431Q_14", 1140], ["R1431Q_36", 700], ["R1431Q_18", 310]])], [10, new Map([["R14334_58", 1020], ["R14334_12", 1020], ["R14334_38", 1000], ["R14334_56", 970], ["R14334_14", 950], ["R14334_36", 830], ["R14334_18", 370], ["R14310_58", 1180], ["R14310_12", 1200], ["R14310_38", 1330], ["R14310_56", 1500], ["R14310_14", 1360], ["R14310_36", 840], ["R14310_18", 370], ["R1431Q_58", 1180], ["R1431Q_12", 1800], ["R1431Q_38", 1710], ["R1431Q_56", 1700], ["R1431Q_14", 1360], ["R1431Q_36", 840], ["R1431Q_18", 370]])], [20, new Map([["R14334_58", null], ["R14334_12", 1270], ["R14334_38", 1250], ["R14334_56", 1240], ["R14334_14", 1220], ["R14334_36", 1200], ["R14334_18", 530], ["R14310_58", null], ["R14310_12", 1400], ["R14310_38", 1480], ["R14310_56", 1600], ["R14310_14", 2000], ["R14310_36", 1230], ["R14310_18", 530], ["R1431Q_58", null], ["R1431Q_12", 1900], ["R1431Q_38", 1900], ["R1431Q_56", 1800], ["R1431Q_14", 1600], ["R1431Q_36", 1230], ["R1431Q_18", 630]])], [40, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", 1450], ["R14334_56", 1340], ["R14334_14", 1330], ["R14334_36", 1570], ["R14334_18", 860], ["R14310_58", null], ["R14310_12", null], ["R14310_38", 1900], ["R14310_56", 1640], ["R14310_14", 2000], ["R14310_36", 1700], ["R14310_18", 860], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", 2000], ["R1431Q_56", 1900], ["R1431Q_14", 2200], ["R1431Q_36", 1800], ["R1431Q_18", 860]])], [60, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", 1520], ["R14334_36", 1660], ["R14334_18", 1200], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", 2000], ["R14310_36", 1900], ["R14310_18", 1200], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", 2400], ["R1431Q_36", 2100], ["R1431Q_18", 1200]])], [80, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 1710], ["R14334_18", 1500], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2000], ["R14310_18", 1540], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2200], ["R1431Q_18", 1550]])], [125, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 1900], ["R14334_18", 1800], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2100], ["R14310_18", 2100], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2400], ["R1431Q_18", 2250]])]])], [0.25, new Map([[0.5, new Map([["R14334_58", 510], ["R14334_12", 450], ["R14334_38", 340], ["R14334_56", null], ["R14334_14", null], ["R14334_36", null], ["R14334_18", null], ["R14310_58", 520], ["R14310_12", 460], ["R14310_38", 350], ["R14310_56", null], ["R14310_14", null], ["R14310_36", null], ["R14310_18", null], ["R1431Q_58", 520], ["R1431Q_12", 460], ["R1431Q_38", 350], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", null], ["R1431Q_18", null]])], [1, new Map([["R14334_58", 530], ["R14334_12", 510], ["R14334_38", 500], ["R14334_56", 480], ["R14334_14", null], ["R14334_36", null], ["R14334_18", null], ["R14310_58", 650], ["R14310_12", 600], ["R14310_38", 550], ["R14310_56", 480], ["R14310_14", null], ["R14310_36", null], ["R14310_18", null], ["R1431Q_58", 760], ["R1431Q_12", 680], ["R1431Q_38", 550], ["R1431Q_56", 480], ["R1431Q_14", null], ["R1431Q_36", null], ["R1431Q_18", null]])], [2, new Map([["R14334_58", 600], ["R14334_12", 580], ["R14334_38", 570], ["R14334_56", 560], ["R14334_14", 530], ["R14334_36", null], ["R14334_18", null], ["R14310_58", 780], ["R14310_12", 880], ["R14310_38", 840], ["R14310_56", 700], ["R14310_14", 530], ["R14310_36", null], ["R14310_18", null], ["R1431Q_58", 1030], ["R1431Q_12", 1020], ["R1431Q_38", 840], ["R1431Q_56", 700], ["R1431Q_14", 530], ["R1431Q_36", null], ["R1431Q_18", null]])], [3, new Map([["R14334_58", 670], ["R14334_12", 650], ["R14334_38", 630], ["R14334_56", 620], ["R14334_14", 600], ["R14334_36", 420], ["R14334_18", null], ["R14310_58", 810], ["R14310_12", 920], ["R14310_38", 1000], ["R14310_56", 870], ["R14310_14", 650], ["R14310_36", 420], ["R14310_18", null], ["R1431Q_58", 1050], ["R1431Q_12", 1200], ["R1431Q_38", 1030], ["R1431Q_56", 870], ["R1431Q_14", 650], ["R1431Q_36", 420], ["R1431Q_18", null]])], [5, new Map([["R14334_58", 790], ["R14334_12", 770], ["R14334_38", 730], ["R14334_56", 720], ["R14334_14", 700], ["R14334_36", 560], ["R14334_18", 250], ["R14310_58", 970], ["R14310_12", 950], ["R14310_38", 1160], ["R14310_56", 1120], ["R14310_14", 890], ["R14310_36", 580], ["R14310_18", 250], ["R1431Q_58", 1060], ["R1431Q_12", 1490], ["R1431Q_38", 1350], ["R1431Q_56", 1180], ["R1431Q_14", 890], ["R1431Q_36", 580], ["R1431Q_18", 250]])], [7.5, new Map([["R14334_58", 900], ["R14334_12", 900], ["R14334_38", 880], ["R14334_56", 860], ["R14334_14", 840], ["R14334_36", 700], ["R14334_18", 310], ["R14310_58", 1060], ["R14310_12", 1140], ["R14310_38", 1270], ["R14310_56", 1340], ["R14310_14", 1140], ["R14310_36", 700], ["R14310_18", 310], ["R1431Q_58", 1060], ["R1431Q_12", 1140], ["R1431Q_38", 1270], ["R1431Q_56", 1340], ["R1431Q_14", 1140], ["R1431Q_36", 700], ["R1431Q_18", 310]])], [10, new Map([["R14334_58", 1020], ["R14334_12", 1020], ["R14334_38", 1000], ["R14334_56", 970], ["R14334_14", 950], ["R14334_36", 830], ["R14334_18", 370], ["R14310_58", 1180], ["R14310_12", 1200], ["R14310_38", 1330], ["R14310_56", 1500], ["R14310_14", 1360], ["R14310_36", 840], ["R14310_18", 370], ["R1431Q_58", 1180], ["R1431Q_12", 1800], ["R1431Q_38", 1710], ["R1431Q_56", 1700], ["R1431Q_14", 1360], ["R1431Q_36", 840], ["R1431Q_18", 370]])], [20, new Map([["R14334_58", null], ["R14334_12", 1270], ["R14334_38", 1250], ["R14334_56", 1240], ["R14334_14", 1220], ["R14334_36", 1200], ["R14334_18", 530], ["R14310_58", null], ["R14310_12", 1400], ["R14310_38", 1480], ["R14310_56", 1600], ["R14310_14", 2000], ["R14310_36", 1230], ["R14310_18", 530], ["R1431Q_58", null], ["R1431Q_12", 1900], ["R1431Q_38", 1900], ["R1431Q_56", 1800], ["R1431Q_14", 1600], ["R1431Q_36", 1230], ["R1431Q_18", 630]])], [40, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", 1450], ["R14334_56", 1340], ["R14334_14", 1330], ["R14334_36", 1570], ["R14334_18", 860], ["R14310_58", null], ["R14310_12", null], ["R14310_38", 1900], ["R14310_56", 1640], ["R14310_14", 2000], ["R14310_36", 1700], ["R14310_18", 860], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", 2000], ["R1431Q_56", 1900], ["R1431Q_14", 2200], ["R1431Q_36", 1800], ["R1431Q_18", 860]])], [60, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", 1520], ["R14334_36", 1660], ["R14334_18", 1200], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", 2000], ["R14310_36", 1900], ["R14310_18", 1200], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", 2400], ["R1431Q_36", 2100], ["R1431Q_18", 1200]])], [80, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 1710], ["R14334_18", 1500], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2000], ["R14310_18", 1540], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2200], ["R1431Q_18", 1550]])], [125, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 1900], ["R14334_18", 1800], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2100], ["R14310_18", 2100], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2400], ["R1431Q_18", 2250]])]])], [2.0, new Map([[5, new Map([["R14334_58", 1100], ["R14334_12", 925], ["R14334_38", 700], ["R14334_56", 600], ["R14334_14", 470], ["R14334_36", 370], ["R14334_18", 220], ["R14310_58", 1150], ["R14310_12", 975], ["R14310_38", 725], ["R14310_56", 600], ["R14310_14", 500], ["R14310_36", 380], ["R14310_18", 220], ["R1431Q_58", 1175], ["R1431Q_12", 1050], ["R1431Q_38", 750], ["R1431Q_56", 600], ["R1431Q_14", 500], ["R1431Q_36", 380], ["R1431Q_18", 220]])], [10, new Map([["R14334_58", 1600], ["R14334_12", 1350], ["R14334_38", 1100], ["R14334_56", 1000], ["R14334_14", 800], ["R14334_36", 600], ["R14334_18", 325], ["R14310_58", 1650], ["R14310_12", 1550], ["R14310_38", 1250], ["R14310_56", 1050], ["R14310_14", 850], ["R14310_36", 625], ["R14310_18", 325], ["R1431Q_58", 1750], ["R1431Q_12", 1700], ["R1431Q_38", 1350], ["R1431Q_56", 1050], ["R1431Q_14", 850], ["R1431Q_36", 675], ["R1431Q_18", 250]])], [20, new Map([["R14334_58", null], ["R14334_12", 1800], ["R14334_38", 1500], ["R14334_56", 1400], ["R14334_14", 1150], ["R14334_36", 975], ["R14334_18", 550], ["R14310_58", null], ["R14310_12", 2100], ["R14310_38", 2050], ["R14310_56", 1800], ["R14310_14", 1475], ["R14310_36", 1100], ["R14310_18", 550], ["R1431Q_58", null], ["R1431Q_12", 2400], ["R1431Q_38", 2200], ["R1431Q_56", 1950], ["R1431Q_14", 1700], ["R1431Q_36", 1100], ["R1431Q_18", 550]])], [40, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", 1850], ["R14334_56", 1700], ["R14334_14", 1450], ["R14334_36", 1200], ["R14334_18", 900], ["R14310_58", null], ["R14310_12", null], ["R14310_38", 2500], ["R14310_56", 2200], ["R14310_14", 2200], ["R14310_36", 1500], ["R14310_18", 900], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", 2600], ["R1431Q_56", 2400], ["R1431Q_14", 2600], ["R1431Q_36", 1950], ["R1431Q_18", 900]])], [60, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", 1825], ["R14334_36", 1650], ["R14334_18", 1100], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", 2500], ["R14310_36", 2050], ["R14310_18", 1125], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", 2600], ["R1431Q_36", 2600], ["R1431Q_18", 1125]])], [100, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 2200], ["R14334_18", 1550], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2600], ["R14310_18", 1850], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2600], ["R1431Q_18", 1850]])], [125, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 2200], ["R14334_18", 1850], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2600], ["R14310_18", 2150], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2600], ["R1431Q_18", 2150]])]])], [6.0, new Map([[5, new Map([["R14334_58", 1100], ["R14334_12", 925], ["R14334_38", 700], ["R14334_56", 600], ["R14334_14", 470], ["R14334_36", 370], ["R14334_18", 220], ["R14310_58", 1150], ["R14310_12", 975], ["R14310_38", 725], ["R14310_56", 600], ["R14310_14", 500], ["R14310_36", 380], ["R14310_18", 220], ["R1431Q_58", 1175], ["R1431Q_12", 1050], ["R1431Q_38", 750], ["R1431Q_56", 600], ["R1431Q_14", 500], ["R1431Q_36", 380], ["R1431Q_18", 220]])], [10, new Map([["R14334_58", 1600], ["R14334_12", 1350], ["R14334_38", 1100], ["R14334_56", 1000], ["R14334_14", 800], ["R14334_36", 600], ["R14334_18", 325], ["R14310_58", 1650], ["R14310_12", 1550], ["R14310_38", 1250], ["R14310_56", 1050], ["R14310_14", 850], ["R14310_36", 625], ["R14310_18", 325], ["R1431Q_58", 1750], ["R1431Q_12", 1700], ["R1431Q_38", 1350], ["R1431Q_56", 1050], ["R1431Q_14", 850], ["R1431Q_36", 675], ["R1431Q_18", 250]])], [20, new Map([["R14334_58", null], ["R14334_12", 1800], ["R14334_38", 1500], ["R14334_56", 1400], ["R14334_14", 1150], ["R14334_36", 975], ["R14334_18", 550], ["R14310_58", null], ["R14310_12", 2100], ["R14310_38", 2050], ["R14310_56", 1800], ["R14310_14", 1475], ["R14310_36", 1100], ["R14310_18", 550], ["R1431Q_58", null], ["R1431Q_12", 2400], ["R1431Q_38", 2200], ["R1431Q_56", 1950], ["R1431Q_14", 1700], ["R1431Q_36", 1100], ["R1431Q_18", 550]])], [40, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", 1850], ["R14334_56", 1700], ["R14334_14", 1450], ["R14334_36", 1200], ["R14334_18", 900], ["R14310_58", null], ["R14310_12", null], ["R14310_38", 2500], ["R14310_56", 2200], ["R14310_14", 2200], ["R14310_36", 1500], ["R14310_18", 900], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", 2600], ["R1431Q_56", 2400], ["R1431Q_14", 2600], ["R1431Q_36", 1950], ["R1431Q_18", 900]])], [60, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", 1825], ["R14334_36", 1650], ["R14334_18", 1100], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", 2500], ["R14310_36", 2050], ["R14310_18", 1125], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", 2600], ["R1431Q_36", 2600], ["R1431Q_18", 1125]])], [100, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 2200], ["R14334_18", 1550], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2600], ["R14310_18", 1850], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2600], ["R1431Q_18", 1850]])], [125, new Map([["R14334_58", null], ["R14334_12", null], ["R14334_38", null], ["R14334_56", null], ["R14334_14", null], ["R14334_36", 2200], ["R14334_18", 1850], ["R14310_58", null], ["R14310_12", null], ["R14310_38", null], ["R14310_56", null], ["R14310_14", null], ["R14310_36", 2600], ["R14310_18", 2150], ["R1431Q_58", null], ["R1431Q_12", null], ["R1431Q_38", null], ["R1431Q_56", null], ["R1431Q_14", null], ["R1431Q_36", 2600], ["R1431Q_18", 2150]])]])]]);
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
function orifice_type143(reg) {
  let suf;
  suf = $slice(reg, (-2), null);
  if ($truthy(($eq(suf, "18")))) {
    return "1/8\"";
  } else {
    if ($truthy(($eq(suf, "36")))) {
      return "3/16\"";
    } else {
      if ($truthy(($eq(suf, "14")))) {
        return "1/4\"";
      } else {
        if ($truthy(($eq(suf, "56")))) {
          return "5/16\"";
        } else {
          if ($truthy(($eq(suf, "38")))) {
            return "3/8\"";
          } else {
            if ($truthy(($eq(suf, "12")))) {
              return "1/2\"";
            } else {
              if ($truthy(($eq(suf, "58")))) {
                return "5/8\"";
              }
            }
          }
        }
      }
    }
  }
}
function orifice_max143(reg) {
  let suf;
  suf = $slice(reg, (-2), null);
  if ($truthy(($eq(suf, "18")))) {
    return 125;
  } else {
    if ($truthy(($eq(suf, "36")))) {
      return 125;
    } else {
      if ($truthy(($eq(suf, "14")))) {
        return 60;
      } else {
        if ($truthy(($eq(suf, "56")))) {
          return 40;
        } else {
          if ($truthy(($eq(suf, "38")))) {
            return 40;
          } else {
            if ($truthy(($eq(suf, "12")))) {
              return 20;
            } else {
              if ($truthy(($eq(suf, "58")))) {
                return 10;
              }
            }
          }
        }
      }
    }
  }
}
function spring_143(op) {
  let $t8;
  if ($truthy((($truthy(($t8 = ((op < (6.5 / 28)))))) ? (((op >= (3.5 / 28)))) : $t8))) {
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
          if ($truthy(((op <= 2)))) {
            return new Map([["color", "Black + White"], ["range", "(0.5 - 2 psi)"]]);
          } else {
            if ($truthy(((op < 3)))) {
              return new Map([["color", "Cadmium"], ["range", "(0.5 - 3 psi)"]]);
            } else {
              if ($truthy(((op <= 6)))) {
                return new Map([["color", "Black"], ["range", "(2 - 6 psi)"]]);
              }
            }
          }
        }
      }
    }
  }
}
function will_irv_work143(reg, opp) {
  let inlet_keys, irv_table, irvhpdata143, irvstddata143, orifice_key, out_pressure_build, p_high, p_low, t, v_high, v_low, $t10, $t9;
  if ($truthy(($eq(opp, "Partial")))) {
    return "Partial";
  }
  irvstddata143 = new Map([[0, new Map([["18", 0.25], ["36", 0.25], ["14", 0.25], ["56", 0.25], ["38", 0.25], ["12", null], ["58", null]])], [10, new Map([["18", 0.25], ["36", 0.35], ["14", 0.5], ["56", 0.75], ["38", 1], ["12", null], ["58", null]])], [17, new Map([["18", 0.25], ["36", 0.5], ["14", 0.65], ["56", 1.05], ["38", 1.75], ["12", null], ["58", null]])], [20, new Map([["18", 0.35], ["36", 0.5], ["14", 0.75], ["56", 1.25], ["38", null], ["12", null], ["58", null]])], [30, new Map([["18", 0.35], ["36", 0.55], ["14", 1.05], ["56", 1.75], ["38", null], ["12", null], ["58", null]])], [40, new Map([["18", 0.35], ["36", 0.75], ["14", 1.45], ["56", null], ["38", null], ["12", null], ["58", null]])], [50, new Map([["18", 0.45], ["36", 0.95], ["14", 1.85], ["56", null], ["38", null], ["12", null], ["58", null]])], [60, new Map([["18", 0.5], ["36", 1.05], ["14", 2.25], ["56", null], ["38", null], ["12", null], ["58", null]])], [70, new Map([["18", 0.5], ["36", 1.25], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [80, new Map([["18", 0.55], ["36", 1.5], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [90, new Map([["18", 0.65], ["36", 1.75], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [100, new Map([["18", 0.75], ["36", 2], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [110, new Map([["18", null], ["36", null], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [120, new Map([["18", null], ["36", null], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [125, new Map([["18", null], ["36", null], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])]]);
  irvhpdata143 = new Map([[3, new Map([["18", 0], ["36", 0], ["14", 0.4], ["56", 0.8], ["38", 0.8], ["12", 0.8], ["58", 0.8]])], [4, new Map([["18", 0.2], ["36", 0.8], ["14", 0.8], ["56", 0.8], ["38", 1], ["12", 1], ["58", 1]])], [5, new Map([["18", 0.6], ["36", 0.9], ["14", 0.9], ["56", 0.9], ["38", 1.1], ["12", 1.3], ["58", 1.4]])], [6, new Map([["18", 0.8], ["36", 0.9], ["14", 0.9], ["56", 1], ["38", 1.2], ["12", 1.4], ["58", 1.6]])], [10, new Map([["18", 0.8], ["36", 0.9], ["14", 1], ["56", 1.2], ["38", 1.6], ["12", 2], ["58", 2.8]])], [14, new Map([["18", 0.9], ["36", 0.9], ["14", 1.2], ["56", 1.5], ["38", 2], ["12", 3], ["58", 4]])], [18, new Map([["18", 0.9], ["36", 1], ["14", 1.3], ["56", 1.8], ["38", 2.6], ["12", 4], ["58", null]])], [20, new Map([["18", 0.9], ["36", 1], ["14", 1.3], ["56", 1.9], ["38", 2.7], ["12", null], ["58", null]])], [30, new Map([["18", 0.9], ["36", 1.2], ["14", 1.7], ["56", 2.6], ["38", 4], ["12", null], ["58", null]])], [40, new Map([["18", 1], ["36", 1.3], ["14", 2], ["56", 3.4], ["38", null], ["12", null], ["58", null]])], [46, new Map([["18", 1], ["36", 1.4], ["14", 2.3], ["56", 4], ["38", null], ["12", null], ["58", null]])], [50, new Map([["18", 1], ["36", 1.4], ["14", 2.5], ["56", null], ["38", null], ["12", null], ["58", null]])], [60, new Map([["18", 1.1], ["36", 1.6], ["14", 3], ["56", null], ["38", null], ["12", null], ["58", null]])], [70, new Map([["18", 1.2], ["36", 1.9], ["14", 3.5], ["56", null], ["38", null], ["12", null], ["58", null]])], [78, new Map([["18", 1.2], ["36", 2.1], ["14", 4], ["56", null], ["38", null], ["12", null], ["58", null]])], [80, new Map([["18", 1.2], ["36", 2.1], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [90, new Map([["18", 1.3], ["36", 2.3], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [100, new Map([["18", 1.4], ["36", 2.6], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [110, new Map([["18", 1.4], ["36", 2.8], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [120, new Map([["18", 1.5], ["36", 3], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])], [125, new Map([["18", 1.6], ["36", 3.2], ["14", null], ["56", null], ["38", null], ["12", null], ["58", null]])]]);
  irv_table = ($truthy(((outlet_input <= 0.5))) ? (irvstddata143) : (irvhpdata143));
  orifice_key = $slice(reg, (-2), null);
  inlet_keys = $sorted($keys(irv_table));
  if ($truthy(((inlet_input <= $get(inlet_keys, 0))))) {
    out_pressure_build = $get($get(irv_table, $get(inlet_keys, 0)), orifice_key);
  } else {
    if ($truthy(((inlet_input >= $get(inlet_keys, (-1)))))) {
      out_pressure_build = $get($get(irv_table, $get(inlet_keys, (-1))), orifice_key);
    } else {
      p_low = $max((() => { const $r = []; for (const p of $iter(inlet_keys)) { if ($truthy(((p <= inlet_input)))) $r.push(p); } return $r; })());
      p_high = $min((() => { const $r = []; for (const p of $iter(inlet_keys)) { if ($truthy(((p >= inlet_input)))) $r.push(p); } return $r; })());
      if ($truthy(($eq(p_low, p_high)))) {
        out_pressure_build = $get($get(irv_table, p_low), orifice_key);
      } else {
        v_low = $get($get(irv_table, p_low), orifice_key);
        v_high = $get($get(irv_table, p_high), orifice_key);
        if ($truthy((($truthy(($t9 = ((v_low === null))))) ? $t9 : (((v_high === null)))))) {
          out_pressure_build = null;
        } else {
          t = ((inlet_input - p_low) / (p_high - p_low));
          out_pressure_build = $add(((1 - t) * v_low), (t * v_high));
        }
      }
    }
  }
  if ($truthy((($truthy(($t10 = ($eq(out_pressure_build, null))))) ? $t10 : (($eq(irv_input, null)))))) {
    return "No";
  } else {
    if ($truthy((($add(out_pressure_build, outlet_input) <= irv_input)))) {
      return "Yes";
    } else {
      return "No";
    }
  }
}
function gen_match143(result, opp) {
  let all_prefixes, body_labels143, cap, match, model, ordered_prefixes, orifice, orifice_order143, pipe_priority, prefix, prioritized, reg, $t11, $t12;
  match = null;
  if ($truthy(((outlet_input > 2)))) {
    model = "143-2HP";
  } else {
    if ($truthy(($eq(opp, "None")))) {
      model = "143-1";
    } else {
      model = "143-2";
    }
  }
  body_labels143 = new Map([["R14334", "3/4\""], ["R14310", "1\""], ["R1431Q", "1-1/4\""]]);
  pipe_priority = new Map([["3/4\"", "R14334"], ["1\"", "R14310"], ["1-1/4\"", "R1431Q"]]);
  all_prefixes = $list($keys(body_labels143));
  prioritized = $dget(pipe_priority, pipesize_input, null);
  if ($truthy(prioritized)) {
    ordered_prefixes = $add([prioritized], (() => { const $r = []; for (const p of $iter(all_prefixes)) { if ($truthy(((!$eq(p, prioritized))))) $r.push(p); } return $r; })());
  } else {
    ordered_prefixes = all_prefixes;
  }
  orifice_order143 = ["58", "12", "38", "56", "14", "36", "18"];
  if ($truthy((($truthy(($t11 = ($eq(opp, "IRV"))))) ? $t11 : (($eq(opp, "Partial")))))) {
    for (const prefix of $iter(ordered_prefixes)) {
      for (const orifice of $iter(orifice_order143)) {
        reg = `${$str(prefix)}_${$str(orifice)}`;
        if ($truthy(($in(reg, result)))) {
          cap = $get(result, reg);
          if ($truthy((($truthy(($t12 = ($eq(will_work(cap, reg, orifice_max143(reg)), "Yes"))))) ? (((!$eq(will_irv_work143(reg, opp), "No")))) : $t12))) {
            match = new Map([["reg", reg], ["model", model], ["diap", null], ["body", $get(body_labels143, prefix)], ["orifice", orifice_type143(reg)], ["seat", null], ["color", $get(spring_143(outlet_input), "color")], ["range", $get(spring_143(outlet_input), "range")], ["capacity", cap], ["opp", "IRV"], ["mon_color", null], ["mon_range", null]]);
            return match;
          }
        }
      }
    }
  } else {
    for (const prefix of $iter(ordered_prefixes)) {
      for (const orifice of $iter(orifice_order143)) {
        reg = `${$str(prefix)}_${$str(orifice)}`;
        if ($truthy(($in(reg, result)))) {
          cap = $get(result, reg);
          if ($truthy(($eq(will_work(cap, reg, orifice_max143(reg)), "Yes")))) {
            match = new Map([["reg", reg], ["model", model], ["diap", null], ["body", $get(body_labels143, prefix)], ["orifice", orifice_type143(reg)], ["seat", null], ["color", $get(spring_143(outlet_input), "color")], ["range", $get(spring_143(outlet_input), "range")], ["capacity", cap], ["opp", ($truthy(($eq(model, "143-1"))) ? ("None") : ("IRV"))], ["mon_color", null], ["mon_range", null]]);
            return match;
          }
        }
      }
    }
  }
}
function run_regulator_selection143(inlet, outlet, opp) {
  let apply, match, result, warning, $t13;
  opp = ($truthy(($eq(opp, "Monitor"))) ? ("IRV") : (opp));
  if ($truthy((($truthy(($t13 = ($eq(opp, "IRV"))))) ? (((outlet_input > 2))) : $t13))) {
    warning = "Cannot size IRV for outlet pressures > 2 psi";
    result = null;
    match = null;
    apply = false;
    return [result, match, apply, warning];
  }
  result = interpolate_capacity(data143, inlet, outlet, false, false);
  warning = null;
  if ($truthy(((typeof (result) === 'string')))) {
    warning = result;
    result = null;
    match = null;
    apply = false;
    return [result, match, apply, warning];
  }
  match = gen_match143(result, opp);
  if ($truthy(match)) {
    apply = true;
    if ($truthy(($eq(opp, "IRV")))) {
      warning = "Sized for IRV";
    }
  } else {
    apply = false;
  }
  return [result, match, apply, warning];
}
function hsc_pnc143(match) {
  let body, body_map, model, orifice, orifice_map, spring, spring_map;
  body_map = new Map([["3/4\"", "3/4"], ["1\"", "1"], ["1-1/4\"", "1-1/4"]]);
  orifice_map = new Map([["1/8\"", "10"], ["3/16\"", "11"], ["1/4\"", "12"], ["5/16\"", "13"], ["3/8\"", "14"], ["1/2\"", "15"], ["5/8\"", "16"]]);
  spring_map = new Map([["Red", "10"], ["Blue", "11"], ["Green", "12"], ["Orange", "13"], ["Black + White", "20"], ["Cadmium", "15"], ["Black", "14"]]);
  model = $get(match, "model");
  body = $dget(body_map, $get(match, "body"), null);
  orifice = $dget(orifice_map, $get(match, "orifice"), null);
  spring = $dget(spring_map, $get(match, "color"), null);
  return `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(spring)}`;
}


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

    var pns = [];
    var pn = hsc_pnc143(match);
    var pnList = Array.isArray(pn) ? pn : [pn];
    for (var q = 0; q < pnList.length; q++) if ($truthy(pnList[q])) pns.push(pnList[q]);
    out.part_numbers = pns;
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


  function $setGlobals(values) {
    inlet_input = values.inlet_input;
    outlet_input = values.outlet_input;
    flow_rate = values.flow_rate;
    maop = values.maop;
    pipesize_input = values.pipesize_input;
    opp_type = values.opp_type;
    irv_input = values.irv_input;
    oversizeby = values.oversizeby;
    oversize_percent = values.oversize_percent;
    gastypemult = values.gastypemult;
    pload = values.pload;
    Patm = values.Patm;
    result143 = values.result143;
  }

  function $setGlobal(name, value) {
    switch (name) {
      case 'inlet_input': inlet_input = value; return;
      case 'outlet_input': outlet_input = value; return;
      case 'flow_rate': flow_rate = value; return;
      case 'maop': maop = value; return;
      case 'pipesize_input': pipesize_input = value; return;
      case 'opp_type': opp_type = value; return;
      case 'irv_input': irv_input = value; return;
      case 'oversizeby': oversizeby = value; return;
      case 'oversize_percent': oversize_percent = value; return;
      case 'gastypemult': gastypemult = value; return;
      case 'pload': pload = value; return;
      case 'Patm': Patm = value; return;
      case 'result143': result143 = value; return;
    }
    throw new Error('not an injected global: ' + name);
  }

  // Join the shared namespace rather than replacing it, so several tools can
  // coexist on one page without clobbering each other.
  var ns = root.USGSizing = root.USGSizing || {};
  ns.sizeModel143 = sizeTool;
  ns.options = ns.options || {};
  ns.options['model-143'] = {
    inlet_units: INLET_UNITS,
    outlet_units: OUTLET_UNITS,
    flow_units: FLOW_UNITS,
    pipe_sizes: PIPE_OPTIONS,
    gas_types: GAS_TYPES
  };
  ns.versions = ns.versions || {};
  ns.versions['model-143'] = {
    version: '1.1.0',
    algorithm: 'sha256:107e1b188178',
    sources: 'sha256:03726d7d4e70'
  };
})(typeof window !== 'undefined' ? window : this);
