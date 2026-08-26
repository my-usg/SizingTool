/**
 * How to drive this tool's form, for the browser test.
 *
 * The shared harness (build/browser_test.js) knows how to load a block and read
 * its output, but not which control corresponds to which input - that is
 * specific to each tool's form. This file supplies that mapping.
 *
 * `d` provides: d.set(id, value) for number/select controls (ids are without
 * the "usg-" prefix) and d.radio(name, value) for radio groups.
 */
const PIPE_OPTIONS = ["N/A", '3/8"', '1/2"', '3/4"', '1"'];

module.exports = {
  fill(d, input) {
    if (input.inlet !== undefined) d.set('inlet', input.inlet);
    if (input.outlet !== undefined) d.set('outlet', input.outlet);
    if (input.flow !== undefined) d.set('flow', input.flow);
    if (input.maop !== undefined) d.set('maop', input.maop);

    if (input.inlet_units) d.set('inlet-units', input.inlet_units);
    if (input.outlet_units) d.set('outlet-units', input.outlet_units);
    if (input.flow_units) d.set('flow-units', input.flow_units);

    if (input.pipe_size) d.set('pipesize', PIPE_OPTIONS.indexOf(input.pipe_size));

    // The 496 only offers an internal relief valve, so "Yes" goes straight to
    // the IRV pressure input - there is no monitor option to choose.
    if (input.opp_required) {
      d.radio('opp', 'Yes');
      if (input.irv_pressure !== undefined) d.set('irv', input.irv_pressure);
    }
    if (input.partial_irv) d.radio('partial', 'Yes');

    if (input.high_efficiency) {
      d.radio('higheff', 'Yes');
      if (input.high_efficiency_pct !== undefined) d.set('pload', input.high_efficiency_pct);
    }
    if (input.override_oversize) {
      d.radio('override', 'Yes');
      if (input.oversize_pct !== undefined) d.set('oversize', input.oversize_pct);
    }

    if (input.gas_type) d.set('gastype', input.gas_type);
    if (input.specific_gravity !== undefined) d.set('sg', input.specific_gravity);

    if (input.high_altitude) {
      d.radio('elevation', 'Yes');
      if (input.atmospheric_pressure !== undefined) d.set('patm', input.atmospheric_pressure);
    }
  },

  // Extra checks specific to this tool's form, run once.
  formChecks(d, check) {
    const doc = d.doc;
    check('required labels start red', doc.getElementById('usg-label-inlet').classList.contains('usg-req'));
    d.set('inlet', 25);
    check('label clears when filled', !doc.getElementById('usg-label-inlet').classList.contains('usg-req'));

    check('no min-flow field (not on the 496)', doc.getElementById('usg-minflow') === null);
    check('no combustion-regulator question', doc.querySelector('input[name="usg-combust"]') === null);
    check('no IRV/monitor preference radio', doc.querySelector('input[name="usg-opppref"]') === null);

    const pipeOpts = Array.from(doc.querySelectorAll('#usg-pipesize option')).map(o => o.textContent);
    check('pipe options are the 496 set',
      JSON.stringify(pipeOpts) === JSON.stringify(['N/A', '3/8"', '1/2"', '3/4"', '1"']), pipeOpts);

    check('flow label has no "Max"',
      doc.getElementById('usg-label-flow').textContent.trim() === 'Gas load / flow rate',
      doc.getElementById('usg-label-flow').textContent);

    check('IRV block hidden initially', doc.getElementById('usg-opp-yes-block').style.display === 'none');
    check('partial-IRV question shown initially', doc.getElementById('usg-opp-no-block').style.display === '');
    d.radio('opp', 'Yes');
    check('opp Yes reveals the IRV pressure input directly',
      doc.getElementById('usg-opp-yes-block').style.display === '');
    check('opp Yes hides the partial-IRV question',
      doc.getElementById('usg-opp-no-block').style.display === 'none');

    d.radio('higheff', 'Yes');
    check('% load slider appears', doc.getElementById('usg-pload-block').style.display === '');
    d.set('pload', 60);
    check('slider badge updates', doc.getElementById('usg-pload-val').textContent === '60');

    d.radio('override', 'Yes');
    check('oversize slider appears', doc.getElementById('usg-oversize-block').style.display === '');

    d.set('gastype', 'Other');
    check('specific gravity appears', doc.getElementById('usg-sg-block').style.display === '');

    d.radio('elevation', 'Yes');
    check('atmospheric pressure appears', doc.getElementById('usg-patm-block').style.display === '');

    check('no +/- steppers', doc.querySelectorAll('.usg-step').length === 0);
    check('5 info tooltips', doc.querySelectorAll('.usg-help').length === 5,
      doc.querySelectorAll('.usg-help').length);
  }
};
