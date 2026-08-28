/*!
 * Model 441/461 Sizing Tool
 * Holland Supply Company
 *
 * GENERATED FILE - DO NOT EDIT.
 * Built from tools/model-461/algorithm.py by build/build.py.
 * Edit the Python, push, and CI regenerates this file.
 *
 * tool:      model-461
 * version:   1.1.0
 * algorithm: sha256:3e1a5a6c5018
 * sources:   sha256:dc483f237cd6
 *
 * Adds to the shared namespace:
 *   USGSizing.sizeModel461(input)  -> result object
 *   USGSizing.versions['model-461']      -> build metadata
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
var $GLOBALS = new Map([["inlet_input",1],["outlet_input",1],["flow_rate",1],["min_flow",1],["maop",1],["opp_type",1],["oversizeby",1],["oversize_percent",1],["gastypemult",1],["pload",1],["Patm",1]]);
var $printBuf = [];
function $print(args) { $printBuf.push(args.map($str).join(' ')); }

var Patm, flow_rate, gastypemult, inlet_input, maop, min_flow, opp_type, outlet_input, oversize_percent, oversizeby, pload;
function model_461_single(inlet_p, outlet_p) {
  let $t1, $t2;
  if ($truthy((($truthy(($t1 = ((inlet_p <= 175))))) ? (((maop <= 175))) : $t1))) {
    if ($truthy(((outlet_p < 1)))) {
      return "N/A";
    } else {
      if ($truthy(((outlet_p <= 3)))) {
        return "461-S";
      } else {
        if ($truthy(((outlet_p <= 10)))) {
          return "461-S or 461-57S";
        } else {
          if ($truthy(((outlet_p <= 75)))) {
            return "461-57S";
          } else {
            if ($truthy(((outlet_p <= 100)))) {
              return "461-57S or 461-X57";
            } else {
              if ($truthy(((outlet_p <= 250)))) {
                return "461-X57";
              } else {
                return "N/A";
              }
            }
          }
        }
      }
    }
  } else {
    if ($truthy((($truthy(($t2 = ((inlet_p <= 1000))))) ? (((maop <= 1000))) : $t2))) {
      if ($truthy(((outlet_p < 3)))) {
        return "N/A";
      } else {
        if ($truthy(((outlet_p <= 75)))) {
          return "461-57S";
        } else {
          if ($truthy(((outlet_p <= 100)))) {
            return "461-57S or 461-X57";
          } else {
            if ($truthy(((outlet_p <= 250)))) {
              return "461-X57";
            } else {
              return "N/A";
            }
          }
        }
      }
    } else {
      return "N/A";
    }
  }
}
function model_461_double(inlet_p, outlet_p) {
  let $t3, $t4;
  if ($truthy((($truthy(($t3 = ((inlet_p <= 175))))) ? (((maop <= 175))) : $t3))) {
    if ($truthy(((outlet_p <= 3)))) {
      return "461-S";
    } else {
      if ($truthy(((outlet_p <= 10)))) {
        return "461-S or 461-57S";
      } else {
        if ($truthy(((outlet_p <= 75)))) {
          return "461-57S";
        } else {
          if ($truthy(((outlet_p <= 100)))) {
            return "461-57S or 461-X57";
          } else {
            if ($truthy(((outlet_p <= 250)))) {
              return "461-X57";
            } else {
              return "N/A";
            }
          }
        }
      }
    }
  } else {
    if ($truthy((($truthy(($t4 = ((inlet_p <= 1000))))) ? (((maop <= 1000))) : $t4))) {
      if ($truthy(((outlet_p < 3)))) {
        return "N/A";
      } else {
        if ($truthy(((outlet_p <= 75)))) {
          return "461-57S";
        } else {
          if ($truthy(((outlet_p <= 100)))) {
            return "461-57S or 461-X57";
          } else {
            if ($truthy(((outlet_p <= 250)))) {
              return "461-X57";
            } else {
              return "N/A";
            }
          }
        }
      }
    } else {
      return "N/A";
    }
  }
}
function model_441_2(inlet_p, outlet_p, max_pressure = null, tier2_max = null) {
  let $t5, $t6, $t7, $t8, $t9;
  if ($truthy(((outlet_p < (5.25 / 28))))) {
    return "N/A";
  } else {
    if ($truthy((($truthy(($t5 = ((inlet_p <= 100))))) ? (((maop <= 100))) : $t5))) {
      if ($truthy(((outlet_p < (5.25 / 28))))) {
        return "N/A";
      } else {
        if ($truthy(((outlet_p <= 3)))) {
          return "441-S";
        } else {
          if ($truthy(((outlet_p <= 6)))) {
            return "441-S or 441-57S";
          } else {
            if ($truthy(((outlet_p <= 75)))) {
              return "441-57S";
            } else {
              if ($truthy(((outlet_p <= 100)))) {
                return "441-57S or 441-X57";
              } else {
                if ($truthy(((outlet_p <= 250)))) {
                  return "441-X57";
                } else {
                  return "N/A";
                }
              }
            }
          }
        }
      }
    } else {
      if ($truthy((($truthy(($t7 = max_pressure))) ? ((($truthy(($t6 = ((inlet_p <= max_pressure))))) ? (((maop <= max_pressure))) : $t6)) : $t7))) {
        if ($truthy(((outlet_p < 3)))) {
          return "N/A";
        } else {
          if ($truthy(((outlet_p <= 75)))) {
            return "441-57S";
          } else {
            if ($truthy(((outlet_p <= 100)))) {
              return "441-57S or 441-X57";
            } else {
              if ($truthy(((outlet_p <= 250)))) {
                return "441-X57";
              } else {
                return "N/A";
              }
            }
          }
        }
      } else {
        if ($truthy((($truthy(($t9 = tier2_max))) ? ((($truthy(($t8 = ((inlet_p <= tier2_max))))) ? (((maop <= tier2_max))) : $t8)) : $t9))) {
          if ($truthy(((outlet_p < 3)))) {
            return "N/A";
          } else {
            if ($truthy(((outlet_p <= 100)))) {
              return "441-57S";
            } else {
              return "N/A";
            }
          }
        } else {
          return "N/A";
        }
      }
    }
  }
}
function model_441_3(inlet_p, outlet_p, max_pressure = null, tier2_max = null) {
  let $t10, $t11, $t12, $t13, $t14;
  if ($truthy((($truthy(($t10 = ((inlet_p <= 100))))) ? (((maop <= 100))) : $t10))) {
    if ($truthy(((outlet_p <= 3)))) {
      return "441-S";
    } else {
      if ($truthy(((outlet_p <= 6)))) {
        return "441-S or 441-57S";
      } else {
        if ($truthy(((outlet_p <= 75)))) {
          return "441-57S";
        } else {
          if ($truthy(((outlet_p <= 100)))) {
            return "441-57S or 441-X57";
          } else {
            if ($truthy(((outlet_p <= 250)))) {
              return "441-X57";
            } else {
              return "N/A";
            }
          }
        }
      }
    }
  } else {
    if ($truthy((($truthy(($t12 = max_pressure))) ? ((($truthy(($t11 = ((inlet_p <= max_pressure))))) ? (((maop <= max_pressure))) : $t11)) : $t12))) {
      if ($truthy(((outlet_p < 3)))) {
        return "N/A";
      } else {
        if ($truthy(((outlet_p <= 75)))) {
          return "441-57S";
        } else {
          if ($truthy(((outlet_p <= 100)))) {
            return "441-57S or 441-X57";
          } else {
            if ($truthy(((outlet_p <= 250)))) {
              return "441-X57";
            } else {
              return "N/A";
            }
          }
        }
      }
    } else {
      if ($truthy((($truthy(($t14 = tier2_max))) ? ((($truthy(($t13 = ((inlet_p <= tier2_max))))) ? (((maop <= tier2_max))) : $t13)) : $t14))) {
        if ($truthy(((outlet_p < 3)))) {
          return "N/A";
        } else {
          if ($truthy(((outlet_p <= 100)))) {
            return "441-57S";
          } else {
            return "N/A";
          }
        }
      } else {
        return "N/A";
      }
    }
  }
}
function model_441_4(inlet_p, outlet_p, max_pressure) {
  let $t15, $t16, $t17;
  if ($truthy((($truthy(($t15 = ((inlet_p <= 100))))) ? (((maop <= 100))) : $t15))) {
    if ($truthy(((outlet_p <= 3)))) {
      return "441-S";
    } else {
      if ($truthy(((outlet_p <= 6)))) {
        return "441-S or 441-57S";
      } else {
        if ($truthy(((outlet_p <= 100)))) {
          return "441-57S";
        } else {
          return "N/A";
        }
      }
    }
  } else {
    if ($truthy((($truthy(($t16 = ((inlet_p <= max_pressure))))) ? (((maop <= max_pressure))) : $t16))) {
      if ($truthy(((outlet_p < 3)))) {
        return "N/A";
      } else {
        if ($truthy((($truthy(($t17 = ((outlet_p <= 100))))) ? (((inlet_p < 720))) : $t17))) {
          return "441-57S";
        } else {
          return "N/A";
        }
      }
    } else {
      return "N/A";
    }
  }
}
function model_441_6(inlet_p, outlet_p, max_pressure) {
  let $t18;
  if ($truthy((($truthy(($t18 = ((inlet_p <= max_pressure))))) ? (((maop <= max_pressure))) : $t18))) {
    if ($truthy(((outlet_p < 3)))) {
      return "N/A";
    } else {
      if ($truthy(((outlet_p <= 100)))) {
        return "441-57S";
      } else {
        return "N/A";
      }
    }
  } else {
    return "N/A";
  }
}
function spring_diap_461S(op) {
  let output, $t19;
  if ($truthy((($truthy(($t19 = ((op >= (2 / 28)))))) ? (((op <= (3.5 / 28)))) : $t19))) {
    output = new Map([["diap", "12\" CI"], ["color", "Aluminum"], ["range", "(2\" - 10\" wc)"]]);
  } else {
    if ($truthy(((op < (6.5 / 28))))) {
      output = new Map([["diap", "12\" Al"], ["color", "Red"], ["range", "(3.5\" - 6.5\" wc)"]]);
    } else {
      if ($truthy(((op < (8.5 / 28))))) {
        output = new Map([["diap", "12\" Al"], ["color", "Blue"], ["range", "(5\" - 8.5\" wc)"]]);
      } else {
        if ($truthy(((op < (14 / 28))))) {
          output = new Map([["diap", "12\" Al"], ["color", "Green"], ["range", "(6\" - 14\" wc)"]]);
        } else {
          if ($truthy(((op < 1)))) {
            output = new Map([["diap", "12\" Al"], ["color", "Orange"], ["range", "(12\" wc - 1 psi)"]]);
          } else {
            if ($truthy(((op < 2)))) {
              output = new Map([["diap", "8\" Al"], ["color", "Orange"], ["range", "(1 - 2 psi)"]]);
            } else {
              if ($truthy(((op < 4.25)))) {
                output = new Map([["diap", "8\" Al"], ["color", "Black"], ["range", "(2 - 4.25 psi)"]]);
              } else {
                if ($truthy(((op < 6.5)))) {
                  output = new Map([["diap", "8\" Al"], ["color", "Cadmium"], ["range", "(3 - 6.5 psi)"]]);
                } else {
                  if ($truthy(((op <= 10)))) {
                    output = new Map([["diap", "8\" Al"], ["color", "Cadmium + White"], ["range", "(6 - 10 psi)"]]);
                  } else {
                    output = "N/A";
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return output;
}
function mon_spring_diap_461S(op) {
  let output;
  if ($truthy(((op <= (3.5 / 28))))) {
    output = new Map([["diap", "12\" CI"], ["color", "Gray"], ["range", "(0.5 - 1.75 psi)"]]);
  } else {
    if ($truthy(((op <= (14 / 28))))) {
      output = new Map([["diap", "12\" Al"], ["color", "Orange"], ["range", "(12\" wc - 1 psi)"]]);
    } else {
      if ($truthy(((op < 1)))) {
        output = new Map([["diap", "12\" Al"], ["color", "Black"], ["range", "(1 - 2 psi)"]]);
      } else {
        if ($truthy(((op < 2)))) {
          output = new Map([["diap", "8\" Al"], ["color", "Black"], ["range", "(2 - 4.25 psi)"]]);
        } else {
          output = new Map([["diap", "8\" Al"], ["color", "Cadmium"], ["range", "(3 - 6.5 psi)"]]);
        }
      }
    }
  }
  return output;
}
function spring_diap_441S(op) {
  let output, $t20;
  if ($truthy((($truthy(($t20 = ((op >= (4.25 / 28)))))) ? (((op <= (4.75 / 28)))) : $t20))) {
    output = new Map([["diap", "18\""], ["color", "Aluminum"], ["range", "(4.25\" - 4.75\" wc)"]]);
  } else {
    if ($truthy(((op < (5.25 / 28))))) {
      output = new Map([["diap", "18\""], ["color", "Green"], ["range", "(4.75\" - 6.5\" wc)"]]);
    } else {
      if ($truthy(((op <= (7 / 28))))) {
        output = new Map([["diap", "16\""], ["color", "Aluminum"], ["range", "(5.25\" - 7\" wc)"]]);
      } else {
        if ($truthy(((op <= (8.5 / 28))))) {
          output = new Map([["diap", "14\""], ["color", "Aluminum"], ["range", "(7\" - 10.5\" wc)"]]);
        } else {
          if ($truthy(((op < (13 / 28))))) {
            output = new Map([["diap", "12\""], ["color", "Aluminum"], ["range", "(8.5\" - 13\" wc)"]]);
          } else {
            if ($truthy(((op < (17 / 28))))) {
              output = new Map([["diap", "12\""], ["color", "Green"], ["range", "(10.5\" - 17\" wc)"]]);
            } else {
              if ($truthy(((op < (23 / 28))))) {
                output = new Map([["diap", "12\""], ["color", "Yellow"], ["range", "(12\" - 23\" wc)"]]);
              } else {
                if ($truthy(((op < 1.5)))) {
                  output = new Map([["diap", "12\""], ["color", "Gray"], ["range", "(21\" wc - 1.5 psi)"]]);
                } else {
                  if ($truthy(((op < 2)))) {
                    output = new Map([["diap", "10\""], ["color", "Gray"], ["range", "(1.25 - 2 psi)"]]);
                  } else {
                    if ($truthy(((op < 3.25)))) {
                      output = new Map([["diap", "10\""], ["color", "Blue"], ["range", "(1.5 - 3.25 psi)"]]);
                    } else {
                      if ($truthy(((op <= 6)))) {
                        output = new Map([["diap", "10\""], ["color", "Red"], ["range", "(2.5 - 6 psi)"]]);
                      } else {
                        output = "N/A";
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
  return output;
}
function mon_spring_diap_441S(op) {
  let output;
  if ($truthy(((op < (5.25 / 28))))) {
    output = new Map([["diap", "18\""], ["color", "Blue"], ["range", "(16.5\" - 21\" wc)"]]);
  } else {
    if ($truthy(((op <= (7 / 28))))) {
      output = new Map([["diap", "16\""], ["color", "Gray"], ["range", "(0.5\" - 1 psi)"]]);
    } else {
      if ($truthy(((op <= (8.5 / 28))))) {
        output = new Map([["diap", "14\""], ["color", "Gray"], ["range", "(17\" wc - 1.25 psi)"]]);
      } else {
        if ($truthy(((op <= (14 / 28))))) {
          output = new Map([["diap", "12\""], ["color", "Gray"], ["range", "(21\" wc - 1.5 psi)"]]);
        } else {
          if ($truthy(((op < 1)))) {
            output = new Map([["diap", "12\""], ["color", "Blue"], ["range", "(1.25 - 2.5 psi)"]]);
          } else {
            if ($truthy(((op < 1.5)))) {
              output = new Map([["diap", "12\""], ["color", "Red"], ["range", "(1.75 - 4 psi)"]]);
            } else {
              output = new Map([["diap", "1\""], ["color", "Red"], ["range", "(2.5 - 6 psi)"]]);
            }
          }
        }
      }
    }
  }
  return output;
}
function spring_57S(op) {
  let $t21;
  if ($truthy((($truthy(($t21 = ((op < 6))))) ? (((op >= 3))) : $t21))) {
    return new Map([["diap", null], ["color", "Yellow"], ["range", "(3 - 6 psi)"]]);
  } else {
    if ($truthy(((op < 9)))) {
      return new Map([["diap", null], ["color", "Gray"], ["range", "(5 - 9 psi)"]]);
    } else {
      if ($truthy(((op < 15)))) {
        return new Map([["diap", null], ["color", "Blue"], ["range", "(7.5 - 15 psi)"]]);
      } else {
        if ($truthy(((op < 30)))) {
          return new Map([["diap", null], ["color", "Red"], ["range", "(12.5 - 30 psi)"]]);
        } else {
          if ($truthy(((op < 55)))) {
            return new Map([["diap", null], ["color", "Brown"], ["range", "(25 - 55 psi)"]]);
          } else {
            if ($truthy(((op < 75)))) {
              return new Map([["diap", null], ["color", "Black"], ["range", "(50 - 75 psi)"]]);
            } else {
              if ($truthy(((op <= 100)))) {
                return new Map([["diap", null], ["color", "Brown + White"], ["range", "(70 - 100 psi)"]]);
              } else {
                return "N/A";
              }
            }
          }
        }
      }
    }
  }
}
function spring_X57(op) {
  let $t22;
  if ($truthy((($truthy(($t22 = ((op < 100))))) ? (((op >= 75))) : $t22))) {
    return new Map([["diap", null], ["color", "Red"], ["range", "(75 - 100 psi)"]]);
  } else {
    if ($truthy(((op < 175)))) {
      return new Map([["diap", null], ["color", "Brown"], ["range", "(100 - 175 psi)"]]);
    } else {
      if ($truthy(((op <= 250)))) {
        return new Map([["diap", null], ["color", "Black"], ["range", "(150 - 250 psi)"]]);
      } else {
        return "N/A";
      }
    }
  }
}
function calc_qmax(K, inlet_p, outlet_p, monitor) {
  let P1, P2, q, ratio;
  P1 = $add(inlet_p, Patm);
  P2 = $add(outlet_p, Patm);
  ratio = (P1 / P2);
  if ($truthy(((ratio < 1.894)))) {
    q = (K * Math.pow((P2 * (P1 - P2)), 0.5));
  } else {
    q = ((K * P1) / 2);
  }
  if ($truthy(monitor)) {
    q *= 0.7;
  }
  q *= gastypemult;
  return q;
}
function applicable(model_str, qmax, qmin, max_flow, min_flow) {
  let $t23;
  if ($truthy(($eq(model_str, "N/A")))) {
    return "N";
  }
  if ($truthy((($truthy(($t23 = (((max_flow * oversizeby) <= qmax))))) ? (((min_flow >= qmin))) : $t23))) {
    return "Y";
  }
  return "N";
}
function build_standard_table(inlet_p, outlet_p, max_flow, min_flow, opp) {
  let K, body, model, monitor, orifice, qmax, qmin, rows, table, yn, $t24;
  rows = [["2\"", "11/16\" single", 650, model_461_single(inlet_p, outlet_p)], ["2\"", "11/16\" double", 1000, model_461_double(inlet_p, outlet_p)], ["2\"", "1\" single", 1300, model_461_single(inlet_p, outlet_p)], ["2\"", "1\" double", 2000, model_461_double(inlet_p, outlet_p)], ["2\"", "1-1/2\"", 4270, model_441_2(inlet_p, outlet_p, 1000, null)], ["2\"", "1-3/4\"", 5450, model_441_2(inlet_p, outlet_p, 575, 1000)], ["3\"", "1-1/2\"", 4270, model_441_3(inlet_p, outlet_p, 1000, null)], ["3\"", "1-3/4\"", 6630, model_441_3(inlet_p, outlet_p, 575, 1000)], ["3\"", "2-1/8\"", 8880, model_441_3(inlet_p, outlet_p, 400, 500)], ["4\"", "1-3/4\"", 5420, model_441_4(inlet_p, outlet_p, 1000)], ["4\"", "2-1/8\"", 8880, model_441_4(inlet_p, outlet_p, 500)], ["4\"", "3\"", 17740, model_441_4(inlet_p, outlet_p, 300)], ["6\"", "2-1/8\"", 8880, model_441_6(inlet_p, outlet_p, 500)], ["6\"", "3\"", 18500, model_441_6(inlet_p, outlet_p, 300)], ["6\"", "4-1/4\"", 33000, model_441_6(inlet_p, outlet_p, 150)]];
  if ($truthy((($truthy(($t24 = ($eq(opp, "Monitor"))))) ? $t24 : (($eq(opp, "IRV")))))) {
    monitor = true;
    opp = "Monitor";
  } else {
    monitor = false;
    opp = "None";
  }
  table = [];
  for (const [body, orifice, K, model] of $iter(rows)) {
    qmax = calc_qmax(K, inlet_p, outlet_p, monitor);
    qmin = (qmax / 20);
    yn = applicable(model, qmax, qmin, max_flow, min_flow);
    (table).push(new Map([["model", model], ["body", body], ["orifice", orifice], ["qmax", qmax], ["qmin", qmin], ["yn", yn]]));
  }
  return table;
}
function build_vport_table(inlet_p, outlet_p, max_flow, min_flow, opp) {
  let K, body, model, monitor, orifice, qmax, qmin, rows, table, yn, $t25;
  rows = [["2\"", "1\" single", 975, model_461_single(inlet_p, outlet_p)], ["2\"", "1\" double", 1500, model_461_double(inlet_p, outlet_p)], ["2\"", "1-1/2\"", 4160, model_441_2(inlet_p, outlet_p, 1000, null)], ["2\"", "1-3/4\"", 5260, model_441_2(inlet_p, outlet_p, 575, 1000)], ["3\"", "1-1/2\"", 4160, model_441_3(inlet_p, outlet_p, 1000, null)], ["3\"", "1-3/4\"", 6390, model_441_3(inlet_p, outlet_p, 575, 1000)], ["3\"", "2-1/8\"", 8440, model_441_3(inlet_p, outlet_p, 400, 500)], ["4\"", "1-3/4\"", 5260, model_441_4(inlet_p, outlet_p, 1000)], ["4\"", "2-1/8\"", 8440, model_441_4(inlet_p, outlet_p, 500)], ["4\"", "3\"", 13850, model_441_4(inlet_p, outlet_p, 300)], ["6\"", "2-1/8\"", 8440, model_441_6(inlet_p, outlet_p, 500)], ["6\"", "3\"", 14430, model_441_6(inlet_p, outlet_p, 300)], ["6\"", "4-1/4\"", 25500, model_441_6(inlet_p, outlet_p, 150)]];
  if ($truthy((($truthy(($t25 = ($eq(opp, "Monitor"))))) ? $t25 : (($eq(opp, "IRV")))))) {
    monitor = true;
    opp = "Monitor";
  } else {
    monitor = false;
    opp = "None";
  }
  table = [];
  for (const [body, orifice, K, model] of $iter(rows)) {
    qmax = calc_qmax(K, inlet_p, outlet_p, monitor);
    qmin = (qmax / 40);
    yn = applicable(model, qmax, qmin, max_flow, min_flow);
    (table).push(new Map([["model", model], ["body", body], ["orifice", orifice], ["qmax", qmax], ["qmin", qmin], ["yn", yn]]));
  }
  return table;
}
function find_first(table) {
  let row;
  for (const row of $iter(table)) {
    if ($truthy(($eq($get(row, "yn"), "Y")))) {
      return row;
    }
  }
  return null;
}
function run_regulator_selection461(inlet_p, outlet_p, max_flow, min_flow, opp, vp_preference) {
  let ansi, apply, body, color, diap, dp, is_vport, match, max_capacity, model, mon_color, mon_range, monitor, monset, orifice, primary, range, raw_model, seat, std, std_match, vp, vp_match, warning, $t26, $t27, $t28, $t29, $t30, $t31, $t32, $t33, $t34, $t35;
  if ($truthy((($truthy(($t26 = ($eq(opp, "Monitor"))))) ? $t26 : (($eq(opp, "IRV")))))) {
    monitor = true;
    opp = "Monitor";
    warning = "Sized for worker/monitor setup";
  } else {
    monitor = false;
    opp = "None";
    warning = null;
  }
  std = build_standard_table(inlet_p, outlet_p, max_flow, min_flow, opp);
  vp = build_vport_table(inlet_p, outlet_p, max_flow, min_flow, opp);
  std_match = find_first(std);
  vp_match = find_first(vp);
  if ($truthy(($eq(vp_preference, "vport")))) {
    primary = ($truthy(vp_match) ? (vp_match) : (std_match));
    is_vport = ((vp_match !== null));
  } else {
    primary = ($truthy(std_match) ? (std_match) : (vp_match));
    is_vport = ((std_match === null));
  }
  if ($truthy(((primary === null)))) {
    match = new Map([["model", "N/A"], ["diap", "N/A"], ["body", "N/A"], ["orifice", "N/A"], ["seat", "N/A"], ["color", "N/A"], ["range", "N/A"], ["capacity", "N/A"], ["opp", "N/A"], ["mon_color", "N/A"], ["mon_range", "N/A"]]);
    apply = false;
    warning = null;
    return [match, apply, warning];
  }
  raw_model = $get(primary, "model");
  if ($truthy(($eq(raw_model, "461-S or 461-57S")))) {
    if ($truthy(((outlet_input <= 3)))) {
      model = "461-S";
    } else {
      model = "461-57S";
    }
  } else {
    if ($truthy(($eq(raw_model, "441-S or 441-57S")))) {
      if ($truthy(((outlet_input <= 3)))) {
        model = "441-S";
      } else {
        model = "441-57S";
      }
    } else {
      if ($truthy(($eq(raw_model, "461-57S or 461-X57")))) {
        if ($truthy(((outlet_input <= 72)))) {
          model = "461-57S";
        } else {
          model = "461-X57";
        }
      } else {
        if ($truthy(($eq(raw_model, "441-57S or 441-X57")))) {
          if ($truthy(((outlet_input <= 72)))) {
            model = "441-57S";
          } else {
            model = "441-X57";
          }
        } else {
          model = raw_model;
        }
      }
    }
  }
  body = $get(primary, "body");
  if ($truthy((($truthy(($t27 = ($eq(model, "441-S"))))) ? $t27 : (($eq(model, "461-S")))))) {
    ansi = "ANSI125";
  } else {
    if ($truthy((($truthy(($t28 = ($eq(model, "441-X57"))))) ? $t28 : (($eq(model, "461-X57")))))) {
      if ($truthy(((maop <= 575)))) {
        ansi = "ANSI250";
      } else {
        if ($truthy(((maop <= 720)))) {
          ansi = "ANSI300";
        } else {
          ansi = "ANSI600";
        }
      }
    } else {
      if ($truthy(((maop <= 175)))) {
        ansi = "ANSI125";
      } else {
        if ($truthy(((maop <= 575)))) {
          ansi = "ANSI250";
        } else {
          if ($truthy(((maop <= 720)))) {
            ansi = "ANSI300";
          } else {
            ansi = "ANSI600";
          }
        }
      }
    }
  }
  body = `${$str(body)} ${$str(ansi)}`;
  orifice = $add($get(primary, "orifice"), ($truthy(is_vport) ? (" VP") : ("")));
  dp = (inlet_p - outlet_p);
  if ($truthy((($truthy(($t29 = ((maop < 575))))) ? (((dp < 250))) : $t29))) {
    if ($truthy((($truthy(($t30 = ($eq($get(primary, "orifice"), "11/16\" single"))))) ? $t30 : (($eq($get(primary, "orifice"), "1\" single")))))) {
      seat = "Poly-Tan";
    } else {
      seat = "BUNA";
    }
  } else {
    seat = "Poly-Tan";
  }
  max_capacity = $get(primary, "qmax");
  monset = 0;
  if ($truthy(monitor)) {
    if ($truthy(((outlet_input < 1)))) {
      monset = $add(outlet_input, 0.5);
    } else {
      if ($truthy(($eq(outlet_input, 1)))) {
        monset = 2;
      } else {
        if ($truthy(((outlet_input <= 2)))) {
          monset = $add(outlet_input, 1.5);
        } else {
          if ($truthy(((outlet_input <= 3)))) {
            monset = $add(outlet_input, 2);
          } else {
            if ($truthy(((outlet_input <= 10)))) {
              monset = $add(outlet_input, 3);
            } else {
              if ($truthy(((outlet_input <= 50)))) {
                monset = $add(outlet_input, 4);
              } else {
                if ($truthy(((outlet_input <= 75)))) {
                  monset = $add(outlet_input, 5);
                } else {
                  if ($truthy(((outlet_input <= 100)))) {
                    monset = $add(outlet_input, 15);
                  } else {
                    if ($truthy(((outlet_input <= 150)))) {
                      monset = $add(outlet_input, 20);
                    } else {
                      if ($truthy(((outlet_input <= 225)))) {
                        monset = $add(outlet_input, 25);
                      } else {
                        monset = 250;
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
  if ($truthy(($in("irv_input", $GLOBALS)))) {
    if ($truthy((($truthy(($t31 = ((!$eq(irv_input, 0)))))) ? (((monset > irv_input))) : $t31))) {
      monset = irv_input;
    }
  }
  mon_color = null;
  mon_range = null;
  if ($truthy((($truthy(($t32 = ($eq(model, "461-57S"))))) ? $t32 : (($eq(model, "441-57S")))))) {
    color = $get(spring_57S(outlet_input), "color");
    range = $get(spring_57S(outlet_input), "range");
    if ($truthy(monitor)) {
      mon_color = $get(spring_57S(monset), "color");
      mon_range = $get(spring_57S(monset), "range");
    }
  } else {
    if ($truthy((($truthy(($t33 = ($eq(model, "461-X57"))))) ? $t33 : (($eq(model, "441-X57")))))) {
      color = $get(spring_X57(outlet_input), "color");
      range = $get(spring_X57(outlet_input), "range");
      if ($truthy(monitor)) {
        mon_color = $get(spring_X57(monset), "color");
        mon_range = $get(spring_X57(monset), "range");
      }
    } else {
      if ($truthy(($eq(model, "441-S")))) {
        color = $get(spring_diap_441S(outlet_input), "color");
        range = $get(spring_diap_441S(outlet_input), "range");
        if ($truthy(monitor)) {
          mon_color = $get(mon_spring_diap_441S(outlet_input), "color");
          mon_range = $get(mon_spring_diap_441S(outlet_input), "range");
        }
      } else {
        if ($truthy(($eq(model, "461-S")))) {
          color = $get(spring_diap_461S(outlet_input), "color");
          range = $get(spring_diap_461S(outlet_input), "range");
          if ($truthy(monset)) {
            mon_color = $get(mon_spring_diap_461S(outlet_input), "color");
            mon_range = $get(mon_spring_diap_461S(outlet_input), "range");
          }
        } else {
          color = "N/A";
          range = "N/A";
        }
      }
    }
  }
  if ($truthy((($truthy(($t34 = ($eq(model, "461-57S"))))) ? $t34 : (($eq(model, "441-57S")))))) {
    diap = null;
  } else {
    if ($truthy((($truthy(($t35 = ($eq(model, "461-X57"))))) ? $t35 : (($eq(model, "441-X57")))))) {
      diap = null;
    } else {
      if ($truthy(($eq(model, "441-S")))) {
        diap = $get(spring_diap_441S(outlet_input), "diap");
      } else {
        if ($truthy(($eq(model, "461-S")))) {
          diap = $get(spring_diap_461S(outlet_input), "diap");
        } else {
          diap = null;
        }
      }
    }
  }
  match = new Map([["model", model], ["diap", diap], ["body", body], ["orifice", orifice], ["seat", seat], ["color", color], ["range", range], ["capacity", max_capacity], ["opp", opp], ["mon_color", mon_color], ["mon_range", mon_range]]);
  if ($truthy(((!$eq($get(match, "model"), "N/A"))))) {
    apply = true;
  } else {
    apply = false;
  }
  return [match, apply, warning];
}
function hsc_pnc461(match) {
  let body, body_map, diap, diap_map, end, model, mon_spring, opp, orifice, orifice_map, output, seat, spring, spring_map, $t36, $t37, $t38, $t39, $t40, $t41, $t42, $t43;
  body_map = new Map([["2\" ANSI125", "2FLG125"], ["2\" ANSI250", "2FLG250"], ["2\" ANSI300", "2FLG300"], ["2\" ANSI600", "2FLG600"], ["3\" ANSI125", "3FLG125"], ["3\" ANSI250", "3FLG250"], ["3\" ANSI300", "3FLG300"], ["3\" ANSI600", "3FLG600"], ["4\" ANSI125", "4FLG125"], ["4\" ANSI250", "4FLG250"], ["4\" ANSI300", "4FLG300"], ["6\" ANSI125", "6FLG125"], ["6\" ANSI250", "6FLG250"]]);
  diap_map = new Map([["10\"", "10"], ["12\"", "12"], ["14\"", "14"], ["16\"", "16"], ["18\"", "18"], ["20\"", "20"], ["12\" CI", "461S-12"], ["12\" Al", "461-12-S"], ["8\" AL", "461-8-S"]]);
  orifice_map = new Map([["11/16\" single", "22S"], ["11/16\" double", "22D"], ["1\" single", "20S"], ["1\" double", "20D"], ["1-1/2\"", "23"], ["1-3/4\"", "24"], ["2-1/8\"", "25"], ["3\"", "26"], ["4-1/4\"", "27"], ["1\" single VP", "20VPS"], ["1\" double VP", "20VPD"], ["1-1/2\" VP", "23VP"], ["1-3/4\" VP", "24VP"], ["2-1/8\" VP", "25VP"], ["3\" VP", "26VP"], ["4-1/4\" VP", "27VP"]]);
  spring_map = new Map([["Aluminum", "24"], ["Green", "12"], ["Yellow", "23"], ["Gray", "27"], ["Blue", "11"], ["Red", "10"], ["Orange", "13"], ["Black", "14"], ["Cadmium", "15"], ["Cadmium + White", "21"], ["Brown", "22"], ["Brown + White", "31"]]);
  model = $get(match, "model");
  body = $dget(body_map, $get(match, "body"), null);
  diap = $dget(diap_map, $get(match, "diap"), null);
  diap = ($truthy(($eq(diap, null))) ? ("EXTCON") : (diap));
  orifice = $dget(orifice_map, $get(match, "orifice"), null);
  seat = $get(match, "seat");
  seat = ($truthy(($eq(seat, "Poly-Tan"))) ? ("PT") : (seat));
  spring = $dget(spring_map, $get(match, "color"), null);
  mon_spring = $dget(spring_map, $get(match, "mon_color"), null);
  opp = $get(match, "opp");
  end = ($truthy(($in($slice(body, (-3), null), ["300", "600"]))) ? ("S") : ("I"));
  if ($truthy(($eq(model, "461-X57")))) {
    seat = ($truthy(($eq(seat, "BUNA"))) ? ("B") : (seat));
    if ($truthy(($eq(opp, "Monitor")))) {
      output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}.ST`], ["monitor", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(mon_spring)}.ST`]]);
    } else {
      output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}.ST`]]);
    }
  } else {
    if ($truthy((($truthy(($t36 = ($eq(model, "461-57S"))))) ? $t36 : (($eq(model, "461-S")))))) {
      seat = ($truthy(($eq(seat, "BUNA"))) ? ("B") : (seat));
      model = ($truthy((($truthy(($t38 = ($eq(diap, "461S-12"))))) ? $t38 : ((($truthy(($t37 = ($eq(diap, "461-12-S"))))) ? $t37 : (($eq(diap, "461-8-S"))))))) ? (diap) : (model));
      if ($truthy(($eq(opp, "Monitor")))) {
        output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}`], ["monitor", `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(seat)}.${$str(mon_spring)}`]]);
      } else {
        output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}`]]);
      }
    } else {
      if ($truthy((($truthy(($t39 = ($eq(model, "441-57S"))))) ? (($in($get(body, 0), ["4", "6"]))) : $t39))) {
        seat = ($truthy(($eq(seat, "BUNA"))) ? ("B") : (seat));
        if ($truthy(($eq(opp, "Monitor")))) {
          output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}.${$str(end)}`], ["monitor", `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(seat)}.${$str(mon_spring)}.${$str(end)}`]]);
        } else {
          output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}.${$str(end)}`]]);
        }
      } else {
        if ($truthy((($truthy(($t41 = ($eq(model, "441-S"))))) ? ((($truthy(($t40 = ($eq(diap, "12"))))) ? (($eq(body, "2FLG125"))) : $t40)) : $t41))) {
          if ($truthy(($eq(opp, "Monitor")))) {
            output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}`], ["monitor", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(mon_spring)}`]]);
          } else {
            output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}`]]);
          }
        } else {
          if ($truthy(($eq(model, "441-57S")))) {
            body = ($truthy(($eq(body, "2FLG125"))) ? ("2FLG") : (($truthy(($eq(body, "3FLG125"))) ? ("3FLG") : (body))));
          }
          if ($truthy(($eq(opp, "Monitor")))) {
            output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}.${$str(end)}`], ["monitor", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(mon_spring)}.${$str(end)}`]]);
          } else {
            output = new Map([["worker", `R.${$str(model)}.${$str(body)}.${$str(diap)}.${$str(orifice)}.${$str(seat)}.${$str(spring)}.${$str(end)}`]]);
          }
        }
      }
    }
  }
  if ($truthy((($truthy(($t43 = ($eq(model, "441-S"))))) ? $t43 : ((($truthy(($t42 = ($eq(model, "441-57S"))))) ? $t42 : (($eq(model, "441-X57")))))))) {
    $set(output, "controlline", "CONTROL LINE KIT - 441-1/2\"");
    if ($truthy(($eq(opp, "Monitor")))) {
      $set(output, "controllineqty", 2);
    } else {
      $set(output, "controllineqty", 1);
    }
  } else {
    $set(output, "controlline", "CONTROL LINE KIT");
    if ($truthy(($eq(opp, "Monitor")))) {
      $set(output, "controllineqty", 2);
    } else {
      $set(output, "controllineqty", 1);
    }
  }
  return output;
}


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
    vp_preference: "standard",
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

  // Standard or V-Port orifice preference. The algorithm expects exactly
  // "standard" or "vport"; anything else falls back to standard so a stray
  // value cannot silently flip the selection to V-Port.
  var vp_preference = (p.vp_preference === "vport") ? "vport" : "standard";

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
    var r = run_regulator_selection461(inlet_psi, outlet_psi, flow_cfh, min_flow, opp_type, vp_preference);
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

    // hsc_pnc* now return a dict: worker, an optional monitor, and an optional
    // control line kit with its quantity. Transpiled Python dicts are JS Maps.
    var pn = hsc_pnc461(match);
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
    // Whole numbers only. The original tool computed min_flow after the float
    // conversion so it printed "5,000.0"; a flow rate reads better without the
    // decimal, so it is rounded for display here.
    kv("Min Flow Rate (" + p.flow_units + ")", $format($round(min_flow), ',')),
    kv("Max Allowable Inlet Pressure (psi)", String(Math.trunc(maop))),
    kv("Overpressure Protection Required", p.opp_required ? "Yes" : "No"),
    kv("Orifice Preference", vp_preference === "vport" ? "V-Port" : "Standard"),
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

  return out;
}


  function $setGlobals(values) {
    inlet_input = values.inlet_input;
    outlet_input = values.outlet_input;
    flow_rate = values.flow_rate;
    min_flow = values.min_flow;
    maop = values.maop;
    opp_type = values.opp_type;
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
      case 'opp_type': opp_type = value; return;
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
  ns.sizeModel461 = sizeTool;
  ns.options = ns.options || {};
  ns.options['model-461'] = {
    inlet_units: INLET_UNITS,
    outlet_units: OUTLET_UNITS,
    flow_units: FLOW_UNITS,
    pipe_sizes: PIPE_OPTIONS,
    gas_types: GAS_TYPES
  };
  ns.versions = ns.versions || {};
  ns.versions['model-461'] = {
    version: '1.1.0',
    algorithm: 'sha256:3e1a5a6c5018',
    sources: 'sha256:dc483f237cd6'
  };
})(typeof window !== 'undefined' ? window : this);
