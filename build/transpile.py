#!/usr/bin/env python3
"""Transpile the USG sizing tool core (restricted Python subset) to JavaScript.

Semantics preserved:
- dicts -> JS Map (keys keep their Python types: numbers stay numbers)
- None -> null, True/False -> true/false
- sorted/max/min/any with Python numeric semantics
- round() -> banker's rounding, int() -> trunc
- truthiness of [], '', 0, None handled via $truthy
- and/or are value-preserving
- f-strings -> template literals via $str/$format
"""
import ast, sys, json

JS_RESERVED = {"abstract","arguments","await","boolean","break","byte","case","catch","char","class","const","continue","debugger","default","delete","do","double","else","enum","eval","export","extends","false","final","finally","float","for","function","goto","if","implements","import","in","instanceof","int","interface","let","long","native","new","null","package","private","protected","public","return","short","static","super","switch","synchronized","this","throw","throws","transient","true","try","typeof","var","void","volatile","while","with","yield"}

def jsname(n):
    return n + "_$" if n in JS_RESERVED else n

class Transpiler:
    def __init__(self, tree):
        self.tree = tree
        self.out = []
        self.indent = 0
        self.tmp = 0
        # collect user function signatures (incl. nested) for kwarg mapping
        self.signatures = {}
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                args = [a.arg for a in node.args.args]
                defaults = node.args.defaults
                ndef = len(defaults)
                defmap = {}
                for i, d in enumerate(defaults):
                    defmap[args[len(args) - ndef + i]] = d
                self.signatures[node.name] = (args, defmap)

    def newtmp(self):
        self.tmp += 1
        return f"$t{self.tmp}"

    def emit(self, line):
        self.out.append("  " * self.indent + line)

    # ---------- expressions ----------
    def expr(self, node):
        m = getattr(self, "e_" + type(node).__name__, None)
        if m is None:
            raise SystemExit(f"Unsupported expr {type(node).__name__} at line {getattr(node,'lineno','?')}")
        return m(node)

    def e_Constant(self, n):
        v = n.value
        if v is None: return "null"
        if v is True: return "true"
        if v is False: return "false"
        if isinstance(v, str): return json.dumps(v, ensure_ascii=False)
        if isinstance(v, (int, float)): return repr(v)
        raise SystemExit(f"const? {v!r}")

    def e_Name(self, n):
        return jsname(n.id)

    def e_Dict(self, n):
        pairs = []
        for k, v in zip(n.keys, n.values):
            pairs.append(f"[{self.expr(k)}, {self.expr(v)}]")
        return "new Map([" + ", ".join(pairs) + "])"

    def e_List(self, n):
        return "[" + ", ".join(self.expr(e) for e in n.elts) + "]"

    def e_Tuple(self, n):
        return "[" + ", ".join(self.expr(e) for e in n.elts) + "]"

    def e_Subscript(self, n):
        if isinstance(n.slice, ast.Slice):
            lo = self.expr(n.slice.lower) if n.slice.lower else "null"
            hi = self.expr(n.slice.upper) if n.slice.upper else "null"
            if n.slice.step: raise SystemExit("slice step unsupported")
            return f"$slice({self.expr(n.value)}, {lo}, {hi})"
        return f"$get({self.expr(n.value)}, {self.expr(n.slice)})"

    def e_UnaryOp(self, n):
        if isinstance(n.op, ast.Not):
            return f"(!$truthy({self.expr(n.operand)}))"
        if isinstance(n.op, ast.USub):
            return f"(-{self.expr(n.operand)})"
        if isinstance(n.op, ast.UAdd):
            return f"(+{self.expr(n.operand)})"
        raise SystemExit("unary op")

    BINOPS = {ast.Sub: "-", ast.Mult: "*", ast.Div: "/"}
    def e_BinOp(self, n):
        if isinstance(n.op, ast.Pow):
            return f"Math.pow({self.expr(n.left)}, {self.expr(n.right)})"
        if isinstance(n.op, ast.Add):
            return f"$add({self.expr(n.left)}, {self.expr(n.right)})"
        op = self.BINOPS.get(type(n.op))
        if op is None: raise SystemExit(f"binop {type(n.op).__name__}")
        return f"({self.expr(n.left)} {op} {self.expr(n.right)})"

    def e_BoolOp(self, n):
        # value-preserving
        vals = [self.expr(v) for v in n.values]
        expr = vals[-1]
        for v in reversed(vals[:-1]):
            t = self.newtmp()
            if isinstance(n.op, ast.And):
                expr = f"(($truthy(({t} = {v}))) ? ({expr}) : {t})"
            else:
                expr = f"(($truthy(({t} = {v}))) ? {t} : ({expr}))"
            self.fn_tmps.add(t)
        return expr

    CMP = {ast.Lt: "<", ast.LtE: "<=", ast.Gt: ">", ast.GtE: ">="}
    def e_Compare(self, n):
        parts = []
        left = n.left
        for op, right in zip(n.ops, n.comparators):
            l, r = self.expr(left), self.expr(right)
            t = type(op)
            if t in self.CMP:
                parts.append(f"({l} {self.CMP[t]} {r})")
            elif t is ast.Eq:
                parts.append(f"$eq({l}, {r})")
            elif t is ast.NotEq:
                parts.append(f"(!$eq({l}, {r}))")
            elif t is ast.Is:
                parts.append(f"({l} === {r})")
            elif t is ast.IsNot:
                parts.append(f"({l} !== {r})")
            elif t is ast.In:
                parts.append(f"$in({l}, {r})")
            elif t is ast.NotIn:
                parts.append(f"(!$in({l}, {r}))")
            else:
                raise SystemExit("cmp")
            left = right
        return "(" + " && ".join(parts) + ")"

    def e_IfExp(self, n):
        return f"($truthy({self.expr(n.test)}) ? ({self.expr(n.body)}) : ({self.expr(n.orelse)}))"

    def comp_to_iife(self, n, is_gen=False):
        # single generator comprehension only
        if len(n.generators) != 1: raise SystemExit("multi-generator comp")
        g = n.generators[0]
        it = self.expr(g.iter)
        if isinstance(g.target, ast.Name):
            tgt = jsname(g.target.id)
            decl = f"const {tgt}"
        elif isinstance(g.target, ast.Tuple):
            tgt = "[" + ", ".join(jsname(e.id) for e in g.target.elts) + "]"
            decl = f"const {tgt}"
        else:
            raise SystemExit("comp target")
        conds = " && ".join(f"$truthy({self.expr(c)})" for c in g.ifs) or "true"
        body = self.expr(n.elt)
        return (f"(() => {{ const $r = []; for ({decl} of $iter({it})) "
                f"{{ if ({conds}) $r.push({body}); }} return $r; }})()")

    def e_ListComp(self, n): return self.comp_to_iife(n)
    def e_GeneratorExp(self, n): return self.comp_to_iife(n, True)

    def e_JoinedStr(self, n):
        parts = []
        for v in n.values:
            if isinstance(v, ast.Constant):
                s = v.value.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
                parts.append(s)
            else:  # FormattedValue
                if v.format_spec is not None:
                    spec = v.format_spec.values[0].value
                    parts.append("${$format(" + self.expr(v.value) + ", " + json.dumps(spec) + ")}")
                else:
                    parts.append("${$str(" + self.expr(v.value) + ")}")
        return "`" + "".join(parts) + "`"

    def e_Call(self, n):
        # method calls
        if isinstance(n.func, ast.Attribute):
            obj = self.expr(n.func.value)
            meth = n.func.attr
            args = [self.expr(a) for a in n.args]
            if meth == "keys":    return f"$keys({obj})"
            if meth == "values":  return f"$values({obj})"
            if meth == "items":   return f"$items({obj})"
            if meth == "get":
                if len(args) == 1: return f"$dget({obj}, {args[0]}, null)"
                return f"$dget({obj}, {args[0]}, {args[1]})"
            if meth == "append":  return f"({obj}).push({', '.join(args)})"
            if meth == "index":   return f"$index({obj}, {args[0]})"
            if meth == "startswith": return f"({obj}).startsWith({', '.join(args)})"
            if meth == "endswith":   return f"({obj}).endsWith({', '.join(args)})"
            if meth == "join":    return f"$join({obj}, {args[0]})"
            if meth == "upper":   return f"({obj}).toUpperCase()"
            if meth == "lower":   return f"({obj}).toLowerCase()"
            if meth == "strip":   return f"({obj}).trim()"
            raise SystemExit(f"method .{meth} line {n.lineno}")
        if not isinstance(n.func, ast.Name):
            raise SystemExit("call func kind")
        name = n.func.id
        args = [self.expr(a) for a in n.args]
        if name == "globals":
            return "$GLOBALS"
        if name == "sorted":  return f"$sorted({args[0]})"
        if name == "max":     return f"$max({args[0]})" if len(args) == 1 else f"$max([{', '.join(args)}])"
        if name == "min":     return f"$min({args[0]})" if len(args) == 1 else f"$min([{', '.join(args)}])"
        if name == "any":     return f"($iter({args[0]}).some($truthy))" if False else f"$any({args[0]})"
        if name == "all":     return f"$all({args[0]})"
        if name == "list":    return f"$list({args[0]})"
        if name == "len":     return f"$len({args[0]})"
        if name == "abs":     return f"Math.abs({args[0]})"
        if name == "round":   return f"$round({', '.join(args)})"
        if name == "int":     return f"Math.trunc({args[0]})"
        if name == "float":   return f"({args[0]})"
        if name == "str":     return f"$str({args[0]})"
        if name == "print":   return f"$print([{', '.join(args)}])"
        if name == "isinstance":
            typ = n.args[1]
            if isinstance(typ, ast.Name):
                tn = {typ.id}
            else:
                tn = {e.id for e in typ.elts}
            checks = []
            if "str" in tn: checks.append(f"(typeof ({args[0]}) === 'string')")
            if "list" in tn or "tuple" in tn: checks.append(f"Array.isArray({args[0]})")
            if "int" in tn or "float" in tn: checks.append(f"(typeof ({args[0]}) === 'number')")
            if "dict" in tn: checks.append(f"(({args[0]}) instanceof Map)")
            return "(" + " || ".join(checks) + ")"
        # user function; map kwargs positionally
        if n.keywords:
            if name not in self.signatures:
                raise SystemExit(f"kwargs to unknown fn {name}")
            params, defmap = self.signatures[name]
            given = {}
            for i, a in enumerate(args):
                given[params[i]] = a
            for kw in n.keywords:
                given[kw.arg] = self.expr(kw.value)
            ordered = []
            for p in params:
                if p in given:
                    ordered.append(given[p])
                elif p in defmap:
                    ordered.append(self.expr(defmap[p]))
                else:
                    raise SystemExit(f"missing arg {p} for {name}")
            # trim trailing defaults not needed? keep all for exactness
            return f"{jsname(name)}({', '.join(ordered)})"
        return f"{jsname(name)}({', '.join(args)})"

    # ---------- statements ----------
    def stmt(self, node):
        m = getattr(self, "s_" + type(node).__name__, None)
        if m is None:
            raise SystemExit(f"Unsupported stmt {type(node).__name__} at line {node.lineno}")
        m(node)

    def s_ImportFrom(self, n): pass
    def s_Import(self, n): pass
    def s_Pass(self, n): self.emit(";")
    def s_Continue(self, n): self.emit("continue;")
    def s_Break(self, n): self.emit("break;")

    def s_Expr(self, n):
        self.emit(self.expr(n.value) + ";")

    def s_Return(self, n):
        if n.value is None:
            self.emit("return null;")
        else:
            self.emit(f"return {self.expr(n.value)};")

    def assign_target(self, tgt, valexpr):
        if isinstance(tgt, ast.Name):
            self.emit(f"{jsname(tgt.id)} = {valexpr};")
        elif isinstance(tgt, ast.Subscript):
            self.emit(f"$set({self.expr(tgt.value)}, {self.expr(tgt.slice)}, {valexpr});")
        elif isinstance(tgt, ast.Tuple):
            names = "[" + ", ".join(jsname(e.id) for e in tgt.elts) + "]"
            self.emit(f"{names} = {valexpr};")
        else:
            raise SystemExit("assign target")

    def s_Assign(self, n):
        val = self.expr(n.value)
        if len(n.targets) == 1:
            self.assign_target(n.targets[0], val)
        else:
            t = self.newtmp(); self.fn_tmps.add(t)
            self.emit(f"{t} = {val};")
            for tgt in n.targets:
                self.assign_target(tgt, t)

    def s_AugAssign(self, n):
        if isinstance(n.op, ast.Add):
            tgt = self.expr(n.target)
            self.assign_target(n.target, f"$add({tgt}, {self.expr(n.value)})")
            return
        op = self.BINOPS.get(type(n.op))
        if isinstance(n.op, ast.Pow):
            tgt = self.expr(n.target)
            self.assign_target(n.target, f"Math.pow({tgt}, {self.expr(n.value)})")
            return
        if op is None: raise SystemExit("augop")
        if isinstance(n.target, ast.Name):
            self.emit(f"{jsname(n.target.id)} {op}= {self.expr(n.value)};")
        elif isinstance(n.target, ast.Subscript):
            obj, key = self.expr(n.target.value), self.expr(n.target.slice)
            self.emit(f"$set({obj}, {key}, ($get({obj}, {key}) {op} {self.expr(n.value)}));")
        else:
            raise SystemExit("aug target")

    def s_If(self, n):
        self.emit(f"if ($truthy({self.expr(n.test)})) {{")
        self.indent += 1
        for s in n.body: self.stmt(s)
        self.indent -= 1
        if n.orelse:
            self.emit("} else {")
            self.indent += 1
            for s in n.orelse: self.stmt(s)
            self.indent -= 1
        self.emit("}")

    def s_For(self, n):
        if n.orelse: raise SystemExit("for-else")
        it = self.expr(n.iter)
        if isinstance(n.target, ast.Name):
            tgt = jsname(n.target.id)
        elif isinstance(n.target, ast.Tuple):
            tgt = "[" + ", ".join(jsname(e.id) for e in n.target.elts) + "]"
        else:
            raise SystemExit("for target")
        self.emit(f"for (const {tgt} of $iter({it})) {{")
        self.indent += 1
        for s in n.body: self.stmt(s)
        self.indent -= 1
        self.emit("}")

    def s_FunctionDef(self, n):
        params, defmap = self.signatures[n.name]
        plist = []
        for p in params:
            if p in defmap:
                plist.append(f"{jsname(p)} = {self.expr(defmap[p])}")
            else:
                plist.append(jsname(p))
        # find local names (assigned in this function, excluding nested funcs)
        locals_ = set()
        nested = []
        def collect(body):
            for st in body:
                if isinstance(st, ast.FunctionDef):
                    nested.append(st)
                    locals_.add(st.name)
                    continue
                for sub in ast.walk(st):
                    if isinstance(sub, ast.FunctionDef):
                        # skip walking into nested defs (walk already flattens...)
                        pass
                    if isinstance(sub, ast.Assign):
                        for t in sub.targets:
                            self._names_in_target(t, locals_)
                    elif isinstance(sub, ast.AugAssign):
                        self._names_in_target(sub.target, locals_)
                    elif isinstance(sub, ast.For):
                        self._names_in_target(sub.target, locals_)
        collect(n.body)
        locals_ -= set(params)
        locals_ -= {st.name for st in nested}
        prev_tmps = self.fn_tmps if hasattr(self, "fn_tmps") else set()
        self.fn_tmps = set()
        self.emit(f"function {jsname(n.name)}({', '.join(plist)}) {{")
        self.indent += 1
        body_start = len(self.out)
        for s in n.body: self.stmt(s)
        decls = sorted(jsname(x) for x in locals_) + sorted(self.fn_tmps)
        if decls:
            self.out.insert(body_start, "  " * self.indent + f"let {', '.join(decls)};")
        self.indent -= 1
        self.emit("}")
        self.fn_tmps = prev_tmps

    def _names_in_target(self, t, acc):
        if isinstance(t, ast.Name):
            acc.add(t.id)
        elif isinstance(t, ast.Tuple):
            for e in t.elts:
                self._names_in_target(e, acc)
        # Subscript targets are not new names

    # ---------- module ----------
    def run(self):
        self.fn_tmps = set()
        # module-level assigned names
        mod_names = set()
        for st in self.tree.body:
            if isinstance(st, ast.Assign):
                for t in st.targets:
                    self._names_in_target(t, mod_names)
            elif isinstance(st, ast.AugAssign):
                self._names_in_target(st.target, mod_names)
            elif isinstance(st, ast.For):
                self._names_in_target(st.target, mod_names)
        # also declare the injected runtime globals
        injected = INJECTED_GLOBALS
        mod_names |= set(injected)
        self.emit("var " + ", ".join(sorted(jsname(x) for x in mod_names)) + ";")
        for st in self.tree.body:
            if isinstance(st, ast.FunctionDef) and st.name in SKIP_FUNCTIONS:
                continue  # console-only output fns; reference CLI-only globals
            self.stmt(st)
        if self.fn_tmps:
            self.out.insert(1, "var " + ", ".join(sorted(self.fn_tmps)) + ";")
        return "\n".join(self.out)


RUNTIME = r"""
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
/*__GLOBALS_MAP__*/
var $printBuf = [];
function $print(args) { $printBuf.push(args.map($str).join(' ')); }
"""

INJECTED_GLOBALS = ["inlet_input","outlet_input","flow_rate","min_flow","maop",
                    "pipesize_input","opp_type","irv_input","oversizeby",
                    "gastypemult","pload","combust_pref","Patm"]
SKIP_FUNCTIONS = {"print_regulator_selection"}

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2]:
        INJECTED_GLOBALS = sys.argv[2].split(",")
    if len(sys.argv) > 3 and sys.argv[3]:
        SKIP_FUNCTIONS = set(sys.argv[3].split(","))
    src = open(sys.argv[1]).read()
    tree = ast.parse(src)
    t = Transpiler(tree)
    body = t.run()
    # $GLOBALS must list exactly the globals THIS tool injects: the algorithms
    # use `'name' in globals()` to decide whether a caller supplied a value,
    # so a hardcoded list makes a tool claim globals it never sets.
    globals_map = "var $GLOBALS = new Map([" + ",".join(
        '["%s",1]' % n for n in INJECTED_GLOBALS) + "]);"
    print(RUNTIME.replace("/*__GLOBALS_MAP__*/", globals_map))
    print(body)
