# ============================================================================
#  USG Model 441/461 Sizing Tool  |  sizing algorithm (SOURCE OF TRUTH)
#
#  This is "441-461 Script.py" with the interactive CLI input() prompts and the
#  print() output section removed. Nothing else has been changed: the
#  functions and capacity data below are byte-for-byte the original.
#
#  The module communicates through module-level globals (inlet_input,
#  outlet_input, flow_rate, min_flow, maop, opp_type, oversizeby,
#  oversize_percent, gastypemult, pload, Patm). Note it does NOT take
#  irv_input or pipesize_input - it checks `'irv_input' in globals()` and
#  expects that to be false here.
#
#  Unlike the other tools the entry point takes the flows as ARGUMENTS:
#      run_regulator_selection461(inlet, outlet, max_flow, min_flow, opp)
#          -> match461, ok461, warning461
#  and the two capacity tables come from their own functions:
#      build_standard_table(...) / build_vport_table(...)
#
#  THIS FILE IS THE SOURCE OF TRUTH. Editing it and pushing is all that is
#  required: CI transpiles it to dist/usg-model-461.js, proves the JavaScript
#  matches this Python on tens of thousands of inputs, and publishes it to the
#  website. Never edit dist/ by hand.
# ============================================================================

#441-461 REGULATOR

# Applicable Models Functions
# ------------------------------------------------------------------------------------------------------

# Returns 461 single valve models
def model_461_single(inlet_p, outlet_p):
    if inlet_p <= 175 and maop <= 175:
        if outlet_p < 1:
            return "N/A"
        elif outlet_p <= 3:
            return "461-S"
        elif outlet_p <= 10:
            return "461-S or 461-57S"
        elif outlet_p <= 75:
            return "461-57S"
        elif outlet_p <= 100:
            return "461-57S or 461-X57"
        elif outlet_p <= 250:
            return "461-X57"
        else:
            return "N/A"
    elif inlet_p <= 1000 and maop <= 1000:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 75:
            return "461-57S"
        elif outlet_p <= 100:
            return "461-57S or 461-X57"
        elif outlet_p <= 250:
            return "461-X57"
        else:
            return "N/A"
    else:
        return "N/A"
    
# Returns 461 double valve models
def model_461_double(inlet_p, outlet_p):
    if inlet_p <= 175 and maop <= 175:
        if outlet_p <= 3:
            return "461-S"
        elif outlet_p <= 10:
            return "461-S or 461-57S"
        elif outlet_p <= 75:
            return "461-57S"
        elif outlet_p <= 100:
            return "461-57S or 461-X57"
        elif outlet_p <= 250:
            return "461-X57"
        else:
            return "N/A"
    elif inlet_p <= 1000 and maop <= 1000:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 75:
            return "461-57S"
        elif outlet_p <= 100:
            return "461-57S or 461-X57"
        elif outlet_p <= 250:
            return "461-X57"
        else:
            return "N/A"
    else:
        return "N/A"

# Returns 441 models for 2"
def model_441_2(inlet_p, outlet_p, max_pressure=None, tier2_max=None):
    if outlet_p < 5.25/28:
        return "N/A"
    elif inlet_p <= 100 and maop <= 100:
        if outlet_p < 5.25/28:
            return "N/A"
        elif outlet_p <= 3:
            return "441-S"
        elif outlet_p <= 6:
            return "441-S or 441-57S"
        elif outlet_p <= 75:
            return "441-57S"
        elif outlet_p <= 100:
            return "441-57S or 441-X57"
        elif outlet_p <= 250:
            return "441-X57"
        else:
            return "N/A"
    elif max_pressure and inlet_p <= max_pressure and maop <= max_pressure:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 75:
            return "441-57S"
        elif outlet_p <= 100:
            return "441-57S or 441-X57"
        elif outlet_p <= 250:
            return "441-X57"
        else:
            return "N/A"
    elif tier2_max and inlet_p <= tier2_max and maop <= tier2_max:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 100:
            return "441-57S"
        else:
            return "N/A"
    else:
        return "N/A"

# Returns 441 models for 3"
def model_441_3(inlet_p, outlet_p, max_pressure=None, tier2_max=None):
    if inlet_p <= 100 and maop <= 100:
        if outlet_p <= 3:
            return "441-S"
        elif outlet_p <= 6:
            return "441-S or 441-57S"
        elif outlet_p <= 75:
            return "441-57S"
        elif outlet_p <= 100:
            return "441-57S or 441-X57"
        elif outlet_p <= 250:
            return "441-X57"
        else:
            return "N/A"
    elif max_pressure and inlet_p <= max_pressure and maop <= max_pressure:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 75:
            return "441-57S"
        elif outlet_p <= 100:
            return "441-57S or 441-X57"
        elif outlet_p <= 250:
            return "441-X57"
        else:
            return "N/A"
    elif tier2_max and inlet_p <= tier2_max and maop <= tier2_max:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 100:
            return "441-57S"
        else:
            return "N/A"
    else:
        return "N/A"

# Returns 441 models for 4"
def model_441_4(inlet_p, outlet_p, max_pressure):
    if inlet_p <= 100 and maop <= 100:
        if outlet_p <= 3:
            return "441-S"
        elif outlet_p <= 6:
            return "441-S or 441-57S"
        elif outlet_p <= 100:
            return "441-57S"
        else:
            return "N/A"
    elif inlet_p <= max_pressure and maop <= max_pressure:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 100 and inlet_p < 720:
            return "441-57S"
        else:
            return "N/A"
    else:
        return "N/A"

# Returns 441 models for 6"
def model_441_6(inlet_p, outlet_p, max_pressure):
    if inlet_p <= max_pressure and maop <= max_pressure:
        if outlet_p < 3:
            return "N/A"
        elif outlet_p <= 100:
            return "441-57S"
        else:
            return "N/A"
    else:
        return "N/A"


# Spring Selections
# ------------------------------------------------------------------------------------------------------

def spring_diap_461S(op):
    if op >= 2/28 and op <= 3.5/28:
        output = {
            'diap': '12" CI',
            'color': 'Aluminum',
            'range': '(2" - 10" wc)',
        }
    elif op < 6.5/28:
        output = {
            'diap': '12" Al',
            'color': 'Red',
            'range': '(3.5" - 6.5" wc)',
        }
    elif op < 8.5/28:
        output = {
            'diap': '12" Al',
            'color': 'Blue',
            'range': '(5" - 8.5" wc)',
        }
    elif op < 14/28:
        output = {
            'diap': '12" Al',
            'color': 'Green',
            'range': '(6" - 14" wc)',
        }
    elif op < 1:
        output = {
            'diap': '12" Al',
            'color': 'Orange',
            'range': '(12" wc - 1 psi)',
        }
    elif op < 2:
        output = {
            'diap': '8" Al',
            'color': 'Orange',
            'range': '(1 - 2 psi)',
        }
    elif op < 4.25:
        output = {
            'diap': '8" Al',
            'color': 'Black',
            'range': '(2 - 4.25 psi)',
        }
    elif op < 6.5:
        output = {
            'diap': '8" Al',
            'color': 'Cadmium',
            'range': '(3 - 6.5 psi)',
        }
    elif op <= 10:
        output = {
            'diap': '8" Al',
            'color': 'Cadmium + White',
            'range': '(6 - 10 psi)',
        }
    else:
        output = 'N/A'
    
    return output

# chooses a monitor spring based on the outlet pressure (not monitor setpoint)
# uses same diap as worker regulator
def mon_spring_diap_461S(op):
    if op <= 3.5/28:
        output = {
            'diap': '12" CI',
            'color': 'Gray',
            'range': '(0.5 - 1.75 psi)',
        }
    elif op <= 14/28:
        output = {
            'diap': '12" Al',
            'color': 'Orange',
            'range': '(12" wc - 1 psi)',
        }
    elif op < 1:
        output = {
            'diap': '12" Al',
            'color': 'Black',
            'range': '(1 - 2 psi)',
        }
    elif op < 2:
        output = {
            'diap': '8" Al',
            'color': 'Black',
            'range': '(2 - 4.25 psi)',
        }
    else:
        output = {
            'diap': '8" Al',
            'color': 'Cadmium',
            'range': '(3 - 6.5 psi)',
        }

    return output

def spring_diap_441S(op):
    if op >= 4.25/28 and op <= 4.75/28:
        output = {
            'diap': '18"',
            'color': 'Aluminum',
            'range': '(4.25" - 4.75" wc)'
        }
    elif op < 5.25/28:
        output = {
            'diap': '18"',
            'color': 'Green',
            'range': '(4.75" - 6.5" wc)'
        }
    elif op <= 7/28:
        output = {
            'diap': '16"',
            'color': 'Aluminum',
            'range': '(5.25" - 7" wc)'
        }
    elif op <= 8.5/28:
        output = {
            'diap': '14"',
            'color': 'Aluminum',
            'range': '(7" - 10.5" wc)'
        }
    elif op < 13/28:
        output = {
            'diap': '12"',
            'color': 'Aluminum',
            'range': '(8.5" - 13" wc)'
        }
    elif op < 17/28:
        output = {
            'diap': '12"',
            'color': 'Green',
            'range': '(10.5" - 17" wc)'
        }
    elif op < 23/28:
        output = {
            'diap': '12"',
            'color': 'Yellow',
            'range': '(12" - 23" wc)'
        }
    elif op < 1.5:
        output = {
            'diap': '12"',
            'color': 'Gray',
            'range': '(21" wc - 1.5 psi)'
        }
    elif op < 2:
        output = {
            'diap': '10"',
            'color': 'Gray',
            'range': '(1.25 - 2 psi)'
        }
    elif op < 3.25:
        output = {
            'diap': '10"',
            'color': 'Blue',
            'range': '(1.5 - 3.25 psi)'
        }
    elif op <= 6:
        output = {
            'diap': '10"',
            'color': 'Red',
            'range': '(2.5 - 6 psi)'
        }
    else:
        output = 'N/A'
    
    return output

# chooses a monitor spring based on the outlet pressure (not monitor setpoint)
# uses same diap as worker regulator
def mon_spring_diap_441S(op):
    if op < 5.25/28:
        output = {
            'diap': '18"',
            'color': 'Blue',
            'range': '(16.5" - 21" wc)'
        }
    elif op <= 7/28:
        output = {
            'diap': '16"',
            'color': 'Gray',
            'range': '(0.5" - 1 psi)'
        }
    elif op <= 8.5/28:
        output = {
            'diap': '14"',
            'color': 'Gray',
            'range': '(17" wc - 1.25 psi)'
        }
    elif op <= 14/28:
        output = {
            'diap': '12"',
            'color': 'Gray',
            'range': '(21" wc - 1.5 psi)'
        }
    elif op < 1:
        output = {
            'diap': '12"',
            'color': 'Blue',
            'range': '(1.25 - 2.5 psi)'
        }
    elif op < 1.5:
        output = {
            'diap': '12"',
            'color': 'Red',
            'range': '(1.75 - 4 psi)'
        }
    else:
        output = {
            'diap': '1"',
            'color': 'Red',
            'range': '(2.5 - 6 psi)'
        }

    return output

def spring_57S(op):
    if op < 6 and op >= 3:
        return {'diap': None, 'color': 'Yellow', 'range': '(3 - 6 psi)'}
    elif op < 9:
        return {'diap': None, 'color': 'Gray', 'range': '(5 - 9 psi)'}
    elif op < 15:
        return {'diap': None, 'color': 'Blue', 'range': '(7.5 - 15 psi)'}
    elif op < 30:
        return {'diap': None, 'color': 'Red', 'range': '(12.5 - 30 psi)'}
    elif op < 55:
        return {'diap': None, 'color': 'Brown', 'range': '(25 - 55 psi)'}
    elif op < 75:
        return {'diap': None, 'color': 'Black', 'range': '(50 - 75 psi)'}
    elif op <= 100:
        return {'diap': None, 'color': 'Brown + White', 'range': '(70 - 100 psi)'}
    else:
        return 'N/A'

def spring_X57(op):
    if op < 100 and op >= 75:
        return {'diap': None, 'color': 'Red', 'range': '(75 - 100 psi)'}
    elif op < 175:
        return {'diap': None, 'color': 'Brown', 'range': '(100 - 175 psi)'}
    elif op <= 250:
        return {'diap': None, 'color': 'Black', 'range': '(150 - 250 psi)'}
    else:
        return 'N/A'


# Capacity Function
# ------------------------------------------------------------------------------------------------------

def calc_qmax(K, inlet_p, outlet_p, monitor):
    P1 = inlet_p + Patm
    P2 = outlet_p + Patm
    ratio = P1 / P2

    if ratio < 1.894:
        q = K * (P2 * (P1 - P2))**0.5
    else:
        q = K * P1 / 2

    if monitor:
        q *= 0.7

    q *= gastypemult

    return q


# Yes/No Determination Function
# ------------------------------------------------------------------------------------------------------

def applicable(model_str, qmax, qmin, max_flow, min_flow):
    if model_str == "N/A":
        return "N"
    if (max_flow * oversizeby) <= qmax and min_flow >= qmin:
        return "Y"
    return "N"


# Capacity Table Function
# ------------------------------------------------------------------------------------------------------

def build_standard_table(inlet_p, outlet_p, max_flow, min_flow, opp):
    rows = [
        # (body,   orifice,         K,      model_fn)
        ('2"',  '11/16" single',   650,   model_461_single(inlet_p, outlet_p)),
        ('2"',  '11/16" double',  1000,   model_461_double(inlet_p, outlet_p)),
        ('2"',  '1" single',      1300,   model_461_single(inlet_p, outlet_p)),
        ('2"',  '1" double',      2000,   model_461_double(inlet_p, outlet_p)),
        ('2"',  '1-1/2"',         4270,   model_441_2(inlet_p, outlet_p, max_pressure=1000)),
        ('2"',  '1-3/4"',         5450,   model_441_2(inlet_p, outlet_p, max_pressure=575, tier2_max=1000)),
        ('3"',  '1-1/2"',         4270,   model_441_3(inlet_p, outlet_p, max_pressure=1000)),
        ('3"',  '1-3/4"',         6630,   model_441_3(inlet_p, outlet_p, max_pressure=575, tier2_max=1000)),
        ('3"',  '2-1/8"',         8880,   model_441_3(inlet_p, outlet_p, max_pressure=400, tier2_max=500)),
        ('4"',  '1-3/4"',         5420,   model_441_4(inlet_p, outlet_p, max_pressure=1000)),
        ('4"',  '2-1/8"',         8880,   model_441_4(inlet_p, outlet_p, max_pressure=500)),
        ('4"',  '3"',            17740,   model_441_4(inlet_p, outlet_p, max_pressure=300)),
        ('6"',  '2-1/8"',         8880,   model_441_6(inlet_p, outlet_p, max_pressure=500)),
        ('6"',  '3"',            18500,   model_441_6(inlet_p, outlet_p, max_pressure=300)),
        ('6"',  '4-1/4"',        33000,   model_441_6(inlet_p, outlet_p, max_pressure=150)),
    ]

    if opp == "Monitor" or opp == "IRV":
        monitor = True
        opp = "Monitor"
    else:
        monitor = False
        opp = "None"

    table = []
    for body, orifice, K, model in rows:
        qmax = calc_qmax(K, inlet_p, outlet_p, monitor)
        qmin = qmax / 20
        yn = applicable(model, qmax, qmin, max_flow, min_flow)
        table.append({
            "model":  model,
            "body":   body,
            "orifice": orifice,
            "qmax":   qmax,
            "qmin":   qmin,
            "yn":     yn,
        })
    return table


def build_vport_table(inlet_p, outlet_p, max_flow, min_flow, opp):
    rows = [
        # (body,   orifice,         K,      model_fn)
        ('2"',  '1" single',      975,   model_461_single(inlet_p, outlet_p)),
        ('2"',  '1" double',      1500,   model_461_double(inlet_p, outlet_p)),
        ('2"',  '1-1/2"',         4160,   model_441_2(inlet_p, outlet_p, max_pressure=1000)),
        ('2"',  '1-3/4"',         5260,   model_441_2(inlet_p, outlet_p, max_pressure=575, tier2_max=1000)),
        ('3"',  '1-1/2"',         4160,   model_441_3(inlet_p, outlet_p, max_pressure=1000)),
        ('3"',  '1-3/4"',         6390,   model_441_3(inlet_p, outlet_p, max_pressure=575, tier2_max=1000)),
        ('3"',  '2-1/8"',         8440,   model_441_3(inlet_p, outlet_p, max_pressure=400, tier2_max=500)),
        ('4"',  '1-3/4"',         5260,   model_441_4(inlet_p, outlet_p, max_pressure=1000)),
        ('4"',  '2-1/8"',         8440,   model_441_4(inlet_p, outlet_p, max_pressure=500)),
        ('4"',  '3"',            13850,   model_441_4(inlet_p, outlet_p, max_pressure=300)),
        ('6"',  '2-1/8"',         8440,   model_441_6(inlet_p, outlet_p, max_pressure=500)),
        ('6"',  '3"',            14430,   model_441_6(inlet_p, outlet_p, max_pressure=300)),
        ('6"',  '4-1/4"',        25500,   model_441_6(inlet_p, outlet_p, max_pressure=150)),
    ]

    if opp == "Monitor" or opp == "IRV":
        monitor = True
        opp = "Monitor"
    else:
        monitor = False
        opp = "None"

    table = []
    for body, orifice, K, model in rows:
        qmax = calc_qmax(K, inlet_p, outlet_p, monitor)
        qmin = qmax / 40
        yn = applicable(model, qmax, qmin, max_flow, min_flow)
        table.append({
            "model":  model,
            "body":   body,
            "orifice": orifice,
            "qmax":   qmax,
            "qmin":   qmin,
            "yn":     yn,
        })
    return table


# Regulator Selection
# ------------------------------------------------------------------------------------------------------

# Return the first row with yn = Y or None
def find_first(table):
    for row in table:
        if row["yn"] == "Y":
            return row
    return None

# Computes regulator selection outputs
# Returns dict with : model, body, orifice, seat, max_capacity
def run_regulator_selection461(inlet_p, outlet_p, max_flow, min_flow, opp, vp_preference):
    
    if opp == "Monitor" or opp == "IRV":
        monitor = True
        opp = "Monitor"
        warning = "Sized for worker/monitor setup"
    else:
        monitor = False
        opp = "None"
        warning = None

    std = build_standard_table(inlet_p, outlet_p, max_flow, min_flow, opp)
    vp  = build_vport_table(inlet_p, outlet_p, max_flow, min_flow, opp)

    std_match = find_first(std)
    vp_match  = find_first(vp)

    # Primary match: V-Port table first if preferred, else standard table first
    if vp_preference == "vport":
        primary = vp_match if vp_match else std_match
        is_vport = vp_match is not None
    else:
        primary = std_match if std_match else vp_match
        is_vport = std_match is None

    if primary is None:
        match = {
            "model":  "N/A",
            "diap":   "N/A",
            "body":   "N/A",
            "orifice": "N/A",
            "seat":   "N/A",
            "color": "N/A",
            "range": "N/A",
            "capacity":     "N/A",
            "opp": "N/A",
            "mon_color": "N/A",
            "mon_range": "N/A",
        }

        apply = False
        warning = None
        return match, apply, warning

    # Model Selection: resolve ambiguous "or" model strings
    raw_model = primary["model"]
    if raw_model == "461-S or 461-57S":
        if outlet_input <= 3:
            model = "461-S"
        else:
            model = "461-57S"
    elif raw_model == "441-S or 441-57S":
        if outlet_input <= 3:
            model = "441-S"
        else:
            model = "441-57S"
    elif raw_model == "461-57S or 461-X57":
        if outlet_input <= 72:
            model = "461-57S"
        else:
            model = "461-X57"
    elif raw_model == "441-57S or 441-X57":
        if outlet_input <= 72:
            model = "441-57S"
        else:
            model = "441-X57"
    else:
        model = raw_model

    # Body Selection
    body = primary["body"]

    # ANSI Selection
    if model == '441-S' or model == '461-S':
        ansi = 'ANSI125'
    elif model == '441-X57' or model == '461-X57':
        if maop <= 575:
            ansi = 'ANSI250'
        elif maop <= 720:
            ansi = 'ANSI300'
        else:
            ansi = 'ANSI600'
    else:
        if maop <= 175:
            ansi = 'ANSI125'
        elif maop <= 575:
            ansi = 'ANSI250'
        elif maop <= 720:
            ansi = 'ANSI300'
        else:
            ansi = 'ANSI600'

    body = f"{body} {ansi}"

    # Orifice Selection (append " VP" suffix when V-Port table is used)
    orifice = primary["orifice"] + (" VP" if is_vport else "")

    # Seat Selection based on pressure conditions
    dp = inlet_p - outlet_p
    if maop < 575 and dp < 250:
        if primary["orifice"] == '11/16" single' or primary["orifice"] == '1" single':
            seat = "Poly-Tan"
        else:
            seat = "BUNA"
    else:
        seat = "Poly-Tan"

    # Max Capacity
    max_capacity = primary["qmax"]

    # Monitor Pressure Setpoint
    monset = 0
    if monitor:
        if outlet_input < 1:
            monset = outlet_input + 0.5
        elif outlet_input == 1:
            monset = 2
        elif outlet_input <= 2:
            monset = outlet_input + 1.5
        elif outlet_input <= 3:
            monset = outlet_input + 2
        elif outlet_input <= 10:
            monset = outlet_input + 3
        elif outlet_input <= 50:
            monset = outlet_input + 4
        elif outlet_input <= 75:
            monset = outlet_input + 5
        elif outlet_input <= 100:
            monset = outlet_input + 15
        elif outlet_input <= 150:
            monset = outlet_input + 20
        elif outlet_input <= 225:
            monset = outlet_input + 25
        else:
            monset = 250

    if 'irv_input' in globals():
        if irv_input != 0 and monset > irv_input:
            monset = irv_input

    mon_color = None
    mon_range = None

     # Spring Selection
     # use outlet input for the mon_spring functions, use monset for the 57S and X57 spring functions when selecting a monitor spring
    if model == "461-57S" or model == "441-57S":
        color = spring_57S(outlet_input)['color']
        range = spring_57S(outlet_input)['range']
        if monitor:
            mon_color = spring_57S(monset)['color']
            mon_range = spring_57S(monset)['range']
    elif model == "461-X57" or model == "441-X57":
        color = spring_X57(outlet_input)['color']
        range = spring_X57(outlet_input)['range']
        if monitor:
            mon_color = spring_X57(monset)['color']
            mon_range = spring_X57(monset)['range']
    elif model == "441-S":
        color = spring_diap_441S(outlet_input)['color']
        range = spring_diap_441S(outlet_input)['range']
        if monitor:
            mon_color = mon_spring_diap_441S(outlet_input)['color']
            mon_range = mon_spring_diap_441S(outlet_input)['range']
    elif model == "461-S":
        color = spring_diap_461S(outlet_input)['color']
        range = spring_diap_461S(outlet_input)['range']
        if monset:
            mon_color = mon_spring_diap_461S(outlet_input)['color']
            mon_range = mon_spring_diap_461S(outlet_input)['range']
    else:
        color = "N/A"
        range = "N/A"

    # Diap Selection for 441-S and 461-S
    if model == "461-57S" or model == "441-57S":
        diap = None
    elif model == "461-X57" or model == "441-X57":
        diap = None
    elif model == "441-S":
        diap = spring_diap_441S(outlet_input)['diap']
    elif model == "461-S":
        diap = spring_diap_461S(outlet_input)['diap']
    else:
        diap = None

    match = {
        "model":   model,
        "diap":   diap,
        "body":    body,
        "orifice": orifice,
        "seat":    seat,
        "color": color,
        "range": range,
        "capacity":      max_capacity,
        "opp": opp,
        "mon_color": mon_color,
        "mon_range": mon_range,
    }

    if match['model'] != "N/A":
        apply = True
    else:
        apply = False

    return match, apply, warning


# Part Number Configurator
# ------------------------------------------------------------------------------------------------------

# Holland Part Number
def hsc_pnc461(match):
    body_map = {
        '2" ANSI125': '2FLG125',
        '2" ANSI250': '2FLG250',
        '2" ANSI300': '2FLG300',
        '2" ANSI600': '2FLG600',
        '3" ANSI125': '3FLG125',
        '3" ANSI250': '3FLG250',
        '3" ANSI300': '3FLG300',
        '3" ANSI600': '3FLG600',
        '4" ANSI125': '4FLG125',
        '4" ANSI250': '4FLG250',
        '4" ANSI300': '4FLG300',
        '6" ANSI125': '6FLG125',
        '6" ANSI250': '6FLG250',
    }
    diap_map = {
        '10"': '10',
        '12"': '12',
        '14"': '14',
        '16"': '16',
        '18"': '18',
        '20"': '20',
        '12" CI': '461S-12',
        '12" Al': '461-12-S',
        '8" AL': '461-8-S',
    }
    orifice_map = {
        '11/16" single': '22S',
        '11/16" double': '22D',
        '1" single': '20S',
        '1" double': '20D',
        '1-1/2"': '23',
        '1-3/4"': '24',
        '2-1/8"': '25',
        '3"': '26',
        '4-1/4"': '27',
        '1" single VP': '20VPS',
        '1" double VP': '20VPD',
        '1-1/2" VP': '23VP',
        '1-3/4" VP': '24VP',
        '2-1/8" VP': '25VP',
        '3" VP': '26VP',
        '4-1/4" VP': '27VP',
    }
    spring_map = {
        'Aluminum': '24',
        'Green': '12',
        'Yellow': '23',
        'Gray': '27',
        'Blue': '11',
        'Red': '10',
        'Orange': '13',
        'Black': '14',
        'Cadmium': '15',
        'Cadmium + White': '21',
        'Brown': '22',
        'Brown + White': '31',
    }

    model = match['model']
    body = body_map.get(match['body'])
    diap = diap_map.get(match['diap'])
    diap = 'EXTCON' if diap == None else diap
    orifice = orifice_map.get(match['orifice'])
    seat = match['seat']
    seat = 'PT' if seat == "Poly-Tan" else seat
    spring = spring_map.get(match['color'])
    mon_spring = spring_map.get(match['mon_color'])
    opp = match['opp']
    end = 'S' if body[-3:] in ('300', '600') else 'I'

    # 461 -------------------
    if model == '461-X57':
        seat = 'B' if seat == "BUNA" else seat
        if opp == "Monitor":
            return [
                f"R.{model}.{body}.{diap}.{orifice}.{seat}.{spring}.ST",
                f"R.{model}.{body}.{diap}.{orifice}.{seat}.{mon_spring}.ST",
            ]
        else:
            return f"R.{model}.{body}.{diap}.{orifice}.{seat}.{spring}.ST"
    
    elif model == '461-57S' or model == '461-S':
        seat = 'B' if seat == "BUNA" else seat
        model = diap if diap == '461S-12' or diap == '461-12-S' or diap == '461-8-S' else model
        if opp == "Monitor":
            return [
                f"R.{model}.{body}.{orifice}.{seat}.{spring}",
                f"R.{model}.{body}.{orifice}.{seat}.{mon_spring}",
            ]
        else:
            return f"R.{model}.{body}.{orifice}.{seat}.{spring}"

    # 441 -------------------
    elif model == '441-57S' and body[0] in ('4', '6'):
        seat = 'B' if seat == "BUNA" else seat
        if opp == "Monitor":
            return [
                f"R.{model}.{body}.{orifice}.{seat}.{spring}.{end}",
                f"R.{model}.{body}.{orifice}.{seat}.{mon_spring}.{end}",
            ]
        else:
            return f"R.{model}.{body}.{orifice}.{seat}.{spring}.{end}"

    elif model == '441-S' and diap == '12' and body == '2FLG125':
        if opp == "Monitor":
            return [
                f"R.{model}.{body}.{diap}.{orifice}.{seat}.{spring}",
                f"R.{model}.{body}.{diap}.{orifice}.{seat}.{mon_spring}",
            ]
        else:
            return f"R.{model}.{body}.{diap}.{orifice}.{seat}.{spring}"

    else:
        if model == '441-57S':
            body = '2FLG' if body == '2FLG125' else '3FLG' if body == '3FLG125' else body
        if opp == "Monitor":
            return [
                f"R.{model}.{body}.{diap}.{orifice}.{seat}.{spring}.{end}",
                f"R.{model}.{body}.{diap}.{orifice}.{seat}.{mon_spring}.{end}",
            ]
        else:
            return f"R.{model}.{body}.{diap}.{orifice}.{seat}.{spring}.{end}"


# Print Functions
# ------------------------------------------------------------------------------------------------------

def print_regulator_selection(match):
    print("REGULATOR SELECTION")
    print(f"Model:", match['model'])
    if match['diap'] != None:
        print(f"Diaphragm Size:", match['diap'])
    print(f"Body Size:", match['body'])
    if match['orifice'] != None:
        print(f"Orifice Size:", match['orifice'])
    if match['seat'] != None:
        print(f"Seat:", match['seat'])
    print(f"Spring:", match['color'], match['range'])
    if match['mon_color'] != None:
        print(f"Monitor Spring:", match['mon_color'], match['mon_range'])
    capacity = match['capacity']
    cap_str = f"{capacity:,.0f}" if isinstance(capacity, (int, float)) else str(capacity)
    print(f"Calculated Capacity (CFH): {cap_str}")

    print("")
    print("Sizing Adjustments")
    print(f"Oversized by {oversize_percent:.0f}%")
    if match['opp'] == "Monitor":
        print("Monitor capacity reduction: 30%")
    if Patm < 14.4:
        print(f"Elevation capacity reduction: {elevation_reduction:.0f}%")
    if gastypemult != 1:
        print(f"Multiplier for other gas: {gastypemult}")


def print_441461_table(title, table):
    print(f"{title}")
    rows = [
        [
            row["model"],
            row["body"],
            row["orifice"],
            f"{row['qmax']:,.0f}",
            f"{row['qmin']:,.0f}",
            row["yn"],
        ]
        for row in table
    ]
    headers = ["Applicable Models", "Body", "Orifice", "Qmax (CFH)", "Qmin (CFH)", "Will Reg Work"]
    print(tabulate(rows, headers=headers, tablefmt="simple_grid"))
