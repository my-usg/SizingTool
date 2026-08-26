/**
 * Reads a JSON array of input objects on stdin, runs each through the shipped
 * bundle, and writes the results as JSON on stdout.
 *
 *   node build/run_js.js dist/usg-all-models.js sizeAllModels < cases.json
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bundlePath = process.argv[2];
const method = process.argv[3] || 'sizeAllModels';
if (!bundlePath) {
  console.error('usage: node build/run_js.js <bundle.js> <methodName> < cases.json');
  process.exit(1);
}
const code = fs.readFileSync(bundlePath, 'utf8');

// Load the bundle exactly as a browser would: it attaches itself to `window`.
let lastError = null;
const sandbox = {
  window: {},
  console: {
    error: function (msg, err) { lastError = (err && (err.message || String(err))) || String(msg); }
  }
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: bundlePath });
const USGSizing = sandbox.window.USGSizing;
if (!USGSizing || typeof USGSizing[method] !== 'function') {
  console.error('bundle did not expose window.USGSizing.' + method);
  process.exit(1);
}
const sizeTool = USGSizing[method];

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  const cases = JSON.parse(raw);
  const out = cases.map(c => {
    lastError = null;
    let result;
    try {
      result = sizeTool(c);
    } catch (err) {
      return { ok: false, errors: ['__JS_EXCEPTION__ ' + (err && err.message)] };
    }
    // The wrapper catches algorithm faults and returns a friendly message. That
    // must never hide a JavaScript-only bug, so surface it for comparison: the
    // Python side has to have failed in the same way for the case to pass.
    if (lastError !== null) result.__algorithm_error = lastError;
    return result;
  });
  process.stdout.write(JSON.stringify(out));
});
