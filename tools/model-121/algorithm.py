# ============================================================================
#  USG Model 121/122 Sizing Tool  |  sizing algorithm (SOURCE OF TRUTH)
#
#  This is "121-122 Script.py" with the interactive CLI input() prompts and the
#  print() output section removed. Nothing else has been changed: the
#  functions and capacity data below are byte-for-byte the original.
#
#  The module communicates through module-level globals (inlet_input,
#  outlet_input, flow_rate, min_flow, maop, pipesize_input, opp_type,
#  irv_input, oversizeby, oversize_percent, gastypemult, pload, Patm).
#
#  run_regulator_selection121() returns SIX values:
#      result121, result121_VP, result122, match121, apply121, warning121
#
#  THIS FILE IS THE SOURCE OF TRUTH. Editing it and pushing is all that is
#  required: CI transpiles it to dist/usg-model-121.js, proves the JavaScript
#  matches this Python on tens of thousands of inputs, and publishes it to the
#  website. Never edit dist/ by hand.
# ============================================================================

#121 REGULATOR

# 121 Standard Data
stddata121 = {
    1.5/28: {
        0.29: {'R1210813': 1500, 'R121081Q': 2000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 4000, 'R1211220': 5000, 'R121122H': 5500, 'R1211230': None, 'R1211630': 10000},
        0.5: {'R1210813': 2500, 'R121081Q': 3500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 4900, 'R1211220': 8900, 'R121122H': 9700, 'R1211230': None, 'R1211630': 19500},
        1: {'R1210813': 4200, 'R121081Q': 5500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 7400, 'R1211220': 13000, 'R121122H': 14400, 'R1211230': None, 'R1211630': 31000},
        2: {'R1210813': 6100, 'R121081Q': 7800, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 11500, 'R1211220': 20500, 'R121122H': 22200, 'R1211230': None, 'R1211630': 47000},
        3: {'R1210813': 7700, 'R121081Q': 9700, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 14600, 'R1211220': 26300, 'R121122H': 29100, 'R1211230': None, 'R1211630': 60000},
        5: {'R1210813': 11200, 'R121081Q': 12700, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 19500, 'R1211220': 35000, 'R121122H': 39500, 'R1211230': None, 'R1211630': 80000},
        10: {'R1210813': 14500, 'R121081Q': 18000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 30000, 'R1211220': 52000, 'R121122H': 58000, 'R1211230': None, 'R1211630': 12500},
        15: {'R1210813': 17300, 'R121081Q': 22500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 37000, 'R1211220': 68000, 'R121122H': 75500, 'R1211230': None, 'R1211630': 14500},
        25: {'R1210813': 23200, 'R121081Q': 27100, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 50000, 'R1211220': 90000, 'R121122H': 100000, 'R1211230': None, 'R1211630': 190000},
        40: {'R1210813': 32000, 'R121081Q': 41000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 68000, 'R1211220': 125000, 'R121122H': 140000, 'R1211230': None, 'R1211630': 260000},
        50: {'R1210813': 38000, 'R121081Q': 48000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 80000, 'R1211220': 150000, 'R121122H': 166000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 44000, 'R121081Q': 56000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 95000, 'R1211220': 175000, 'R121122H': 195000, 'R1211230': None, 'R1211630': None},    
    },
	0.18: {
        0.29: {'R1210813': 1500, 'R121081Q': 2000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 4000, 'R1211220': 5000, 'R121122H': 5500, 'R1211230': None, 'R1211630': 10000},
        0.5: {'R1210813': 2500, 'R121081Q': 3500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 4900, 'R1211220': 8900, 'R121122H': 9700, 'R1211230': None, 'R1211630': 19500},
        1: {'R1210813': 4200, 'R121081Q': 5500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 7400, 'R1211220': 13000, 'R121122H': 14400, 'R1211230': None, 'R1211630': 31000},
        2: {'R1210813': 6100, 'R121081Q': 7800, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 11500, 'R1211220': 20500, 'R121122H': 22200, 'R1211230': None, 'R1211630': 47000},
        3: {'R1210813': 7700, 'R121081Q': 9700, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 14600, 'R1211220': 26300, 'R121122H': 29100, 'R1211230': None, 'R1211630': 60000},
        5: {'R1210813': 11200, 'R121081Q': 12700, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 19500, 'R1211220': 35000, 'R121122H': 39500, 'R1211230': None, 'R1211630': 80000},
        10: {'R1210813': 14500, 'R121081Q': 18000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 30000, 'R1211220': 52000, 'R121122H': 58000, 'R1211230': None, 'R1211630': 12500},
        15: {'R1210813': 17300, 'R121081Q': 22500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 37000, 'R1211220': 68000, 'R121122H': 75500, 'R1211230': None, 'R1211630': 14500},
        25: {'R1210813': 23200, 'R121081Q': 27100, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 50000, 'R1211220': 90000, 'R121122H': 100000, 'R1211230': None, 'R1211630': 190000},
        40: {'R1210813': 32000, 'R121081Q': 41000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 68000, 'R1211220': 125000, 'R121122H': 140000, 'R1211230': None, 'R1211630': 260000},
        50: {'R1210813': 38000, 'R121081Q': 48000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 80000, 'R1211220': 150000, 'R121122H': 166000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 44000, 'R121081Q': 56000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 95000, 'R1211220': 175000, 'R121122H': 195000, 'R1211230': None, 'R1211630': None},
    },
	0.25: {	
        0.29: {'R1210813': 1000, 'R121081Q': 1500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 3000, 'R1211220': 4000, 'R121122H': 4500, 'R1211230': None, 'R1211630': 9700},
        0.5: {'R1210813': 2300, 'R121081Q': 3000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 4500, 'R1211220': 8000, 'R121122H': 9000, 'R1211230': None, 'R1211630': 19000},
        1: {'R1210813': 4000, 'R121081Q': 5000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 7000, 'R1211220': 12500, 'R121122H': 14000, 'R1211230': None, 'R1211630': 30800},
        2: {'R1210813': 6000, 'R121081Q': 7500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 11000, 'R1211220': 20000, 'R121122H': 22000, 'R1211230': None, 'R1211630': 46000},
        3: {'R1210813': 7500, 'R121081Q': 9500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 14500, 'R1211220': 26000, 'R121122H': 29000, 'R1211230': None, 'R1211630': 59000},
        5: {'R1210813': 10000, 'R121081Q': 12500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 19400, 'R1211220': 35000, 'R121122H': 39500, 'R1211230': None, 'R1211630': 80000},
        10: {'R1210813': 14000, 'R121081Q': 17850, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 30000, 'R1211220': 52000, 'R121122H': 58000, 'R1211230': None, 'R1211630': 125000},
        15: {'R1210813': 17000, 'R121081Q': 22000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 37000, 'R1211220': 68000, 'R121122H': 75500, 'R1211230': None, 'R1211630': 145000},
        25: {'R1210813': 23000, 'R121081Q': 27000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 50000, 'R1211220': 90000, 'R121122H': 100000, 'R1211230': None, 'R1211630': 190000},
        40: {'R1210813': 32000, 'R121081Q': 41000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 68000, 'R1211220': 125000, 'R121122H': 140000, 'R1211230': None, 'R1211630': 260000},
        50: {'R1210813': 38000, 'R121081Q': 48000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 80000, 'R1211220': 150000, 'R121122H': 166000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 44000, 'R121081Q': 56000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 95000, 'R1211220': 175000, 'R121122H': 195000, 'R1211230': None, 'R1211630': None},
    },
	0.39: {	
        0.5: {'R1210813': 2000, 'R121081Q': 2200, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 3700, 'R1211220': 6600, 'R121122H': 7300, 'R1211230': None, 'R1211630': 18000},
        1: {'R1210813': 3600, 'R121081Q': 4500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 6500, 'R1211220': 12000, 'R121122H': 13000, 'R1211230': None, 'R1211630': 29000},
        2: {'R1210813': 5500, 'R121081Q': 7000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 10300, 'R1211220': 19400, 'R121122H': 21000, 'R1211230': None, 'R1211630': 46000},
        3: {'R1210813': 7400, 'R121081Q': 9000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 13750, 'R1211220': 25000, 'R121122H': 27900, 'R1211230': None, 'R1211630': 58000},
        5: {'R1210813': 9900, 'R121081Q': 11200, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 18500, 'R1211220': 34500, 'R121122H': 38700, 'R1211230': None, 'R1211630': 78000},
        10: {'R1210813': 13700, 'R121081Q': 17000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 28000, 'R1211220': 51000, 'R121122H': 57000, 'R1211230': None, 'R1211630': 120000},
        15: {'R1210813': 16500, 'R121081Q': 21700, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 36200, 'R1211220': 67500, 'R121122H': 74000, 'R1211230': None, 'R1211630': 145000},
        25: {'R1210813': 22700, 'R121081Q': 26200, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 49000, 'R1211220': 89000, 'R121122H': 99000, 'R1211230': None, 'R1211630': 190000},
        40: {'R1210813': 31200, 'R121081Q': 40000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 67100, 'R1211220': 124000, 'R121122H': 138000, 'R1211230': None, 'R1211630': 260000},
        50: {'R1210813': 37700, 'R121081Q': 45000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 79000, 'R1211220': 148000, 'R121122H': 164000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 43300, 'R121081Q': 55000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 93500, 'R1211220': 174000, 'R121122H': 193000, 'R1211230': None, 'R1211630': None},
    },
	0.64: {	
        1: {'R1210813': 2500, 'R121081Q': 4000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 6000, 'R1211220': 11000, 'R121122H': 12000, 'R1211230': None, 'R1211630': 27000},
        2: {'R1210813': 5000, 'R121081Q': 6000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 9500, 'R1211220': 17500, 'R121122H': 19100, 'R1211230': None, 'R1211630': 34000},
        3: {'R1210813': 7200, 'R121081Q': 8000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 12500, 'R1211220': 23400, 'R121122H': 26000, 'R1211230': None, 'R1211630': 53000},
        5: {'R1210813': 9700, 'R121081Q': 10400, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 17300, 'R1211220': 33500, 'R121122H': 37000, 'R1211230': None, 'R1211630': 74000},
        10: {'R1210813': 13000, 'R121081Q': 16000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 27000, 'R1211220': 49600, 'R121122H': 54800, 'R1211230': None, 'R1211630': 120000},
        15: {'R1210813': 15800, 'R121081Q': 20500, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 35000, 'R1211220': 65500, 'R121122H': 71900, 'R1211230': None, 'R1211630': 138500},
        25: {'R1210813': 22000, 'R121081Q': 25400, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 47400, 'R1211220': 88000, 'R121122H': 97100, 'R1211230': None, 'R1211630': 185000},
        40: {'R1210813': 30000, 'R121081Q': 39000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 66000, 'R1211220': 120000, 'R121122H': 133500, 'R1211230': None, 'R1211630': 260000},
        50: {'R1210813': 37000, 'R121081Q': 43600, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 77700, 'R1211220': 145000, 'R121122H': 156000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 42500, 'R121081Q': 53000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 90000, 'R1211220': 171200, 'R121122H': 189700, 'R1211230': None, 'R1211630': None},
    },
	1: {	
        2: {'R1210813': 5200, 'R121081Q': 6200, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 10000, 'R1211220': 18000, 'R121122H': 20000, 'R1211230': 35000, 'R1211630': 35000},
        3: {'R1210813': 7300, 'R121081Q': 8400, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 13000, 'R1211220': 23800, 'R121122H': 27100, 'R1211230': 53000, 'R1211630': 55000},
        5: {'R1210813': 9800, 'R121081Q': 10800, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 18000, 'R1211220': 34000, 'R121122H': 37600, 'R1211230': 74000, 'R1211630': 75000},
        10: {'R1210813': 13500, 'R121081Q': 16300, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 27500, 'R1211220': 50000, 'R121122H': 55500, 'R1211230': 110000, 'R1211630': 125000},
        15: {'R1210813': 16000, 'R121081Q': 21000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 35700, 'R1211220': 66000, 'R121122H': 72300, 'R1211230': 139000, 'R1211630': 140000},
        25: {'R1210813': 22500, 'R121081Q': 25900, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 48000, 'R1211220': 88500, 'R121122H': 98000, 'R1211230': 185000, 'R1211630': 190000},
        40: {'R1210813': 31000, 'R121081Q': 39600, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 66600, 'R1211220': 121500, 'R121122H': 135000, 'R1211230': 100000, 'R1211630': 260000},
        50: {'R1210813': 38000, 'R121081Q': 44000, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 78000, 'R1211220': 146500, 'R121122H': 158000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 43000, 'R121081Q': 53800, 'R121081H': None, 'R1210820': None, 'R121082H': None, 'R121121H': 92000, 'R1211220': 172000, 'R121122H': 191000, 'R1211230': None, 'R1211630': None},
    },
	2: {	
        3: {'R1210813': 6000, 'R121081Q': 7200, 'R121081H': 8500, 'R1210820': 15000, 'R121082H': 16700, 'R121121H': 10000, 'R1211220': 19000, 'R121122H': 21500, 'R1211230': 40000, 'R1211630': None},
        5: {'R1210813': 9000, 'R121081Q': 9700, 'R121081H': 13000, 'R1210820': 24000, 'R121082H': 26700, 'R121121H': 16400, 'R1211220': 30000, 'R121122H': 33500, 'R1211230': 65000, 'R1211630': None},
        10: {'R1210813': 12200, 'R121081Q': 15400, 'R121081H': 21000, 'R1210820': 39000, 'R121082H': 43500, 'R121121H': 25100, 'R1211220': 49000, 'R121122H': 53000, 'R1211230': 100000, 'R1211630': None},
        15: {'R1210813': 15000, 'R121081Q': 18900, 'R121081H': 27000, 'R1210820': 50000, 'R121082H': 55000, 'R121121H': 34000, 'R1211220': 64700, 'R121122H': 70100, 'R1211230': 135000, 'R1211630': None},
        25: {'R1210813': 21400, 'R121081Q': 24900, 'R121081H': 36000, 'R1210820': 65000, 'R121082H': 72000, 'R121121H': 46000, 'R1211220': 84500, 'R121122H': 94000, 'R1211230': 183000, 'R1211630': None},
        40: {'R1210813': 30100, 'R121081Q': 38400, 'R121081H': 50000, 'R1210820': 90000, 'R121082H': 100000, 'R121121H': 64200, 'R1211220': 118000, 'R121122H': 130000, 'R1211230': 200000, 'R1211630': None},
        50: {'R1210813': 35500, 'R121081Q': 42000, 'R121081H': 66000, 'R1210820': 120000, 'R121082H': 133000, 'R121121H': 74900, 'R1211220': 143300, 'R121122H': 155000, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 42000, 'R121081Q': 52100, 'R121081H': 71500, 'R1210820': 130000, 'R121082H': 144000, 'R121121H': 87000, 'R1211220': 170000, 'R121122H': 188000, 'R1211230': None, 'R1211630': None},
    },
	3: {	
        5: {'R1210813': 7500, 'R121081Q': 8300, 'R121081H': 11000, 'R1210820': 20000, 'R121082H': 22000, 'R121121H': 14000, 'R1211220': 27500, 'R121122H': 27500, 'R1211230': 55000, 'R1211630': None},
        10: {'R1210813': 11500, 'R121081Q': 15000, 'R121081H': 20000, 'R1210820': 37000, 'R121082H': 41000, 'R121121H': 25500, 'R1211220': 46500, 'R121122H': 52000, 'R1211230': 90000, 'R1211630': None},
        15: {'R1210813': 14300, 'R121081Q': 18000, 'R121081H': 26000, 'R1210820': 48000, 'R121082H': 53500, 'R121121H': 31500, 'R1211220': 61500, 'R121122H': 66500, 'R1211230': 125000, 'R1211630': None},
        25: {'R1210813': 20000, 'R121081Q': 24000, 'R121081H': 35100, 'R1210820': 64000, 'R121082H': 71000, 'R121121H': 45500, 'R1211220': 87000, 'R121122H': 94000, 'R1211230': 175000, 'R1211630': None},
        40: {'R1210813': 29500, 'R121081Q': 38000, 'R121081H': 47000, 'R1210820': 85000, 'R121082H': 94500, 'R121121H': 63500, 'R1211220': 116500, 'R121122H': 129500, 'R1211230': 200000, 'R1211630': None},
        50: {'R1210813': 34500, 'R121081Q': 40800, 'R121081H': 63500, 'R1210820': 116000, 'R121082H': 129000, 'R121121H': 76000, 'R1211220': 139500, 'R121122H': 153500, 'R1211230': None, 'R1211630': None},
        60: {'R1210813': 40000, 'R121081Q': 51600, 'R121081H': 70000, 'R1210820': 127000, 'R121082H': 140000, 'R121121H': 86500, 'R1211220': 165500, 'R121122H': 179000, 'R1211230': None, 'R1211630': None},
    },
}

#122 Data
stddata122 = {
	0.18: {
        0.29: {'R1220810': 1550, 'R122081Q': 2000, 'R122121H': 4000, 'R1221220': 5000, 'R122122H': 5500},
        0.5: {'R1220810': 2500, 'R122081Q': 3500, 'R122121H': 4900, 'R1221220': 8800, 'R122122H': 9600},
        1: {'R1220810': 4200, 'R122081Q': 5000, 'R122121H': 6600, 'R1221220': 12200, 'R122122H': 13600},
        2: {'R1220810': 5700, 'R122081Q': 7300, 'R122121H': 10500, 'R1221220': 18200, 'R122122H': 20700},
        3: {'R1220810': 7300, 'R122081Q': 9000, 'R122121H': 12000, 'R1221220': 25000, 'R122122H': 27000},
        5: {'R1220810': 8000, 'R122081Q': 10000, 'R122121H': 14500, 'R1221220': 32000, 'R122122H': 35000},
        10: {'R1220810': 9000, 'R122081Q': 15000, 'R122121H': 16000, 'R1221220': 38000, 'R122122H': 42000},
        15: {'R1220810': 9000, 'R122081Q': 15000, 'R122121H': 18000, 'R1221220': 38000, 'R122122H': 48000},
    },
	0.25: {	
        0.29: {'R1220810': 1000, 'R122081Q': 1500, 'R122121H': 3000, 'R1221220': 4000, 'R122122H': 4500},
        0.5: {'R1220810': 2300, 'R122081Q': 3000, 'R122121H': 4500, 'R1221220': 8000, 'R122122H': 9000},
        1: {'R1220810': 4000, 'R122081Q': 4800, 'R122121H': 6500, 'R1221220': 12000, 'R122122H': 13400},
        2: {'R1220810': 5500, 'R122081Q': 7000, 'R122121H': 10000, 'R1221220': 18000, 'R122122H': 20000},
        3: {'R1220810': 7000, 'R122081Q': 8700, 'R122121H': 12000, 'R1221220': 25000, 'R122122H': 27000},
        5: {'R1220810': 8000, 'R122081Q': 9800, 'R122121H': 14500, 'R1221220': 32000, 'R122122H': 35000},
        10: {'R1220810': 9500, 'R122081Q': 15700, 'R122121H': 16000, 'R1221220': 38000, 'R122122H': 42000},
        15: {'R1220810': 9500, 'R122081Q': 15700, 'R122121H': 18000, 'R1221220': 38000, 'R122122H': 48000},
    },
	0.39: {	
        0.5: {'R1220810': 2000, 'R122081Q': 2200, 'R122121H': 3700, 'R1221220': 6600, 'R122122H': 7300},
        1: {'R1220810': 3600, 'R122081Q': 4000, 'R122121H': 6000, 'R1221220': 11500, 'R122122H': 12100},
        2: {'R1220810': 5300, 'R122081Q': 6400, 'R122121H': 9800, 'R1221220': 17300, 'R122122H': 19200},
        3: {'R1220810': 6000, 'R122081Q': 8000, 'R122121H': 11100, 'R1221220': 24000, 'R122122H': 26500},
        5: {'R1220810': 8400, 'R122081Q': 9500, 'R122121H': 13900, 'R1221220': 30000, 'R122122H': 32000},
        10: {'R1220810': 10000, 'R122081Q': 15200, 'R122121H': 15000, 'R1221220': 35000, 'R122122H': 39000},
        15: {'R1220810': 11000, 'R122081Q': 15800, 'R122121H': 19000, 'R1221220': 40000, 'R122122H': 48000},
    },
	0.64: {	
        1: {'R1220810': 2500, 'R122081Q': 3600, 'R122121H': 5750, 'R1221220': 10700, 'R122122H': 11300},
        2: {'R1220810': 4000, 'R122081Q': 5700, 'R122121H': 9000, 'R1221220': 16500, 'R122122H': 18200},
        3: {'R1220810': 4900, 'R122081Q': 6900, 'R122121H': 10000, 'R1221220': 22300, 'R122122H': 24900},
        5: {'R1220810': 7800, 'R122081Q': 8800, 'R122121H': 12000, 'R1221220': 28100, 'R122122H': 30200},
        10: {'R1220810': 9500, 'R122081Q': 14500, 'R122121H': 13500, 'R1221220': 32200, 'R122122H': 36000},
        15: {'R1220810': 11500, 'R122081Q': 15000, 'R122121H': 19000, 'R1221220': 39000, 'R122122H': 42000},
    },
	1: {	
        2: {'R1220810': 4500, 'R122081Q': 6000, 'R122121H': 9500, 'R1221220': 16900, 'R122122H': 18800},
        3: {'R1220810': 5200, 'R122081Q': 7200, 'R122121H': 10500, 'R1221220': 23000, 'R122122H': 25400},
        5: {'R1220810': 8000, 'R122081Q': 9100, 'R122121H': 12700, 'R1221220': 29000, 'R122122H': 31000},
        10: {'R1220810': 9700, 'R122081Q': 14900, 'R122121H': 14000, 'R1221220': 33000, 'R122122H': 37000},
        15: {'R1220810': 11500, 'R122081Q': 15000, 'R122121H': 20000, 'R1221220': 40000, 'R122122H': 45000},
    },
	2: {	
        3: {'R1220810': 4000, 'R122081Q': 6300, 'R122121H': 8900, 'R1221220': 18000, 'R122122H': 20000},
        5: {'R1220810': 7500, 'R122081Q': 8100, 'R122121H': 10000, 'R1221220': 27400, 'R122122H': 29000},
        10: {'R1220810': 9000, 'R122081Q': 13800, 'R122121H': 12700, 'R1221220': 30000, 'R122122H': 33000},
        15: {'R1220810': 11000, 'R122081Q': 14000, 'R122121H': 18000, 'R1221220': 36000, 'R122122H': 39900},
    },
}

#121-8-HP Data
hpdata121 = {
	3: {
        5: {'R121HP13': 7500, 'R121HP1Q': 8300, 'R121HP1H': 11000, 'R121HP20': 20000, 'R121HP2H': 22000},
        10: {'R121HP13': 11500, 'R121HP1Q': 15000, 'R121HP1H': 20000, 'R121HP20': 37000, 'R121HP2H': 41000},
        15: {'R121HP13': 14300, 'R121HP1Q': 18000, 'R121HP1H': 26000, 'R121HP20': 48000, 'R121HP2H': 53500},
        25: {'R121HP13': 20000, 'R121HP1Q': 24000, 'R121HP1H': 35100, 'R121HP20': 64000, 'R121HP2H': 71000},
        40: {'R121HP13': 29500, 'R121HP1Q': 38000, 'R121HP1H': 47000, 'R121HP20': 85000, 'R121HP2H': 94500},
        50: {'R121HP13': 34500, 'R121HP1Q': 40800, 'R121HP1H': 63500, 'R121HP20': 116000, 'R121HP2H': 129000},
        60: {'R121HP13': 40000, 'R121HP1Q': 51600, 'R121HP1H': 70000, 'R121HP20': 127000, 'R121HP2H': 140000},
    },
    5: {
        10: {'R121HP13': 11000, 'R121HP1Q': 14200, 'R121HP1H': 16500, 'R121HP20': 30000, 'R121HP2H': 33500},
        15: {'R121HP13': 14000, 'R121HP1Q': 17300, 'R121HP1H': 24500, 'R121HP20': 45000, 'R121HP2H': 50000},
        25: {'R121HP13': 19200, 'R121HP1Q': 23100, 'R121HP1H': 33000, 'R121HP20': 60000, 'R121HP2H': 66500},
        40: {'R121HP13': 28000, 'R121HP1Q': 37200, 'R121HP1H': 44500, 'R121HP20': 80000, 'R121HP2H': 89000},
        50: {'R121HP13': 34000, 'R121HP1Q': 39800, 'R121HP1H': 62000, 'R121HP20': 114000, 'R121HP2H': 127000},
        60: {'R121HP13': 38500, 'R121HP1Q': 50000, 'R121HP1H': 68000, 'R121HP20': 123000, 'R121HP2H': 135000},
    },
	10: {	
        15: {'R121HP13': 10000, 'R121HP1Q': 14000, 'R121HP1H': 22000, 'R121HP20': 40000, 'R121HP2H': 44500},
        25: {'R121HP13': 17000, 'R121HP1Q': 20000, 'R121HP1H': 30000, 'R121HP20': 55000, 'R121HP2H': 61000},
        40: {'R121HP13': 24000, 'R121HP1Q': 34000, 'R121HP1H': 42700, 'R121HP20': 76000, 'R121HP2H': 85000},
        50: {'R121HP13': 30000, 'R121HP1Q': 37000, 'R121HP1H': 60500, 'R121HP20': 110000, 'R121HP2H': 122000},
        60: {'R121HP13': 35000, 'R121HP1Q': 45000, 'R121HP1H': 66500, 'R121HP20': 121000, 'R121HP2H': 130000},
    },
}


# Interpolation Function
# ------------------------------------------------------------------------------------------------------

def interpolate_capacity(data, inlet, outlet, monitor_used, vp):
    outlet_vals = sorted(data.keys())

    if outlet < outlet_vals[0] or outlet > outlet_vals[-1]:
        return "Error: inlet pressure is out of range for given outlet pressure"

    outlet_low = max([p for p in outlet_vals if p <= outlet])
    outlet_high = min([p for p in outlet_vals if p >= outlet])

    def inlet_interpolate(section):
        #Interpolate capacities at the target inlet pressure within one outlet section.
        inlet_vals = sorted(section.keys())
        if not inlet_vals or inlet < inlet_vals[0] or inlet > inlet_vals[-1]:
            return None
        inlet_low = max([p for p in inlet_vals if p <= inlet])
        inlet_high = min([p for p in inlet_vals if p >= inlet])
        u = (inlet - inlet_low) / (inlet_high - inlet_low) if inlet_high != inlet_low else 0
        result = {}
        for reg in section[inlet_low]:
            f0 = section[inlet_low][reg]
            f1 = section[inlet_high][reg]
            if f0 is None or f1 is None:
                result[reg] = None
            else:
                result[reg] = (1 - u) * f0 + u * f1
        return result

    cap_low = inlet_interpolate(data[outlet_low])
    cap_high = inlet_interpolate(data[outlet_high])

    if cap_low is None or cap_high is None:
        return "Error: inlet pressure is out of range for given outlet pressure"

    t = (outlet - outlet_low) / (outlet_high - outlet_low) if outlet_high != outlet_low else 0

    capacities = {}
    for reg in cap_low:
        v_low = cap_low[reg]
        v_high = cap_high.get(reg)
        if v_low is None or v_high is None:
            capacities[reg] = "N/A"
            continue
        interpolated = (1 - t) * v_low + t * v_high

        if monitor_used:
            interpolated *= 0.7

        if vp:
            interpolated *= 0.8

        interpolated *= gastypemult

        # Adjustment for altitude
        if Patm < 14.4:
            ratio = (inlet + Patm)/(outlet + Patm)
            if ratio < 1.894:
                alt_adj = (((outlet+Patm)*((inlet+Patm)-(outlet+Patm)))**0.5) / (((outlet+14.65)*((inlet+14.65)-(outlet+14.65)))**0.5)
            else:
                alt_adj = (inlet+Patm)/(inlet+14.65)
            
            if alt_adj < 1:
                interpolated *= alt_adj

        capacities[reg] = int(round(interpolated))

    return capacities


# Body Types & MAOP Function
# ------------------------------------------------------------------------------------------------------

def body_type121(reg):
    suf = reg[-2:]
    if suf == "13":
        return '3/4" or 1"'
    elif suf == "10":
        return '1"'
    elif suf == "1Q":
        return '1-1/4"'
    elif suf == "1H":
        return '1-1/2"'
    elif suf == "20":
        return '2"'
    elif suf == "2H":
        return '2-1/2"'
    elif suf == "30":
        return '3"'
    return "Unknown"

def body_max121(reg):
    pre = reg[:6]
    suf = reg[-2:]
    if pre == 'R12208' or pre == 'R12212':
        return 15
    elif suf == '30':
        return 40
    else:
        return 60


# Spring Selection
# ------------------------------------------------------------------------------------------------------

def spring_121_122(op, reg):
    if reg == 'R1210813' or reg == 'R121081Q':
        if op >= 1.5/28 and op <= 3.5/28:
            return {
                'color': 'Blue-Black with Black-Red counter',
                'range': '(1.5" - 3.5" wc)',
            }
        elif op < 6.5/28:
            return {
                'color': 'Red-Black',
                'range': '(3.5" - 6.5" wc)',
            }
        elif op < 8.5/28:
            return {
                'color': 'Blue-Black',
                'range': '(5" - 8.5" wc)',
            }
        elif op < 14/28:
            return {
                'color': 'Green-Black',
                'range': '(12" - 28" wc)',
            }
        elif op <= 1:
            return {
                'color': 'Green',
                'range': '(12" - 28" wc)',
            }
        elif op <= 2:
            return {
                'color': 'Orange',
                'range': '(1 - 2 psi)',
            }
        elif op <= 4.25:
            return {
                'color': 'Black',
                'range': '(2 - 4.25 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R121081H' or reg == 'R1210820' or reg == 'R121082H':
        if op >= 1 and op <= 2:
            return {
                'color': 'Orange',
                'range': '(1 - 2 psi)',
            }
        elif op <= 4.25:
            return {
                'color': 'Black',
                'range': '(2 - 4.25 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R121121H' or reg == 'R1211220' or reg == 'R121122H':
        if op >= 1.5/28 and op <= 3.5/28:
            return {
                'color': 'Red with counter',
                'range': '(1.5" - 3.5" wc)',
            }
        elif op < 6.5/28:
            return {
                'color': 'Red',
                'range': '(3.5" - 6.5" wc)',
            }
        elif op < 8.5/28:
            return {
                'color': 'Blue',
                'range': '(5" - 8.5" wc)',
            }
        elif op < 14/28:
            return {
                'color': 'Green',
                'range': '(6" - 14" wc)',
            }
        elif op <= 1:
            return {
                'color': 'Orange',
                'range': '(12" - 28" wc)',
            }
        elif op < 2:
            return {
                'color': 'Black',
                'range': '(1 - 2 psi)',
            }
        elif op <= 3:
            return {
                'color': 'Cadmium',
                'range': '(1.5 - 3 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R1211230':
        if op >= 1 and op < 2:
            return {
                'color': 'Black',
                'range': '(1 - 2 psi)',
            }
        elif op <= 3:
            return {
                'color': 'Cadmium',
                'range': '(1.5 - 3 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R1211630':
        if op >= 3.5/28 and op < 6.5/28:
            return {
                'color': 'Red',
                'range': '(3.5" - 6.5" wc)',
            }
        elif op < 8.5/28:
            return {
                'color': 'Blue',
                'range': '(5" - 8.5" wc)',
            }
        elif op < 14/28:
            return {
                'color': 'Green',
                'range': '(6" - 14" wc)',
            }
        elif op < 1:
            return {
                'color': 'Orange',
                'range': '(14" - 28" wc)',
            }
        elif op <= 1.25:
            return {
                'color': 'Yellow',
                'range': '(0.5 - 1.25 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R121HP13' or reg == 'R121HP1Q' or reg == 'R121HP1H' or reg == 'R121HP20' or reg == 'R121HP2H':
        if op >= 3 and op < 6.5:
            return {
                'color': 'Cadmium',
                'range': '(3 - 6.5 psi)',
            }
        elif op <= 10:
            return {
                'color': 'Cadmium + White',
                'range': '(6 - 10 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R1220810' or reg == 'R122081Q':
        if op >= 1.5/28 and op <= 3.5/28:
            return {
                'color': 'Blue-black with Black counter',
                'range': '(1.5" - 3.5" wc)',
            }
        elif op < 6.5/28:
            return {
                'color': 'Red-Black',
                'range': '(3.5" - 6.5" wc)',
            }
        elif op < 8.5/28:
            return {
                'color': 'Blue-Black',
                'range': '(5" - 8.5" wc)',
            }
        elif op < 14/28:
            return {
                'color': 'Green-Black',
                'range': '(6" - 14" wc)',
            }
        elif op <= 1:
            return {
                'color': 'Green',
                'range': '(12" - 28" wc)',
            }
        elif op <= 2:
            return {
                'color': 'Orange',
                'range': '(1 - 2 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    elif reg == 'R122121H' or reg == 'R1221220' or reg == 'R122122H':
        if op >= 1.5/28 and op <= 3.5/28:
            return {
                'color': 'Red with Red-Black counter',
                'range': '(1.5 - 3.5)',
            }
        elif op < 6.5/28:
            return {
                'color': 'Red',
                'range': '(3.5" - 6.5" wc)',
            }
        elif op < 8.5/28:
            return {
                'color': 'Blue',
                'range': '(5" - 8.5" wc)',
            }
        elif op < 14/28:
            return {
                'color': 'Green',
                'range': '(6" - 14" wc)',
            }
        elif op <= 1:
            return {
                'color': 'Orange',
                'range': '(12" - 28" wc)',
            }
        elif op <= 2:
            return {
                'color': 'Black',
                'range': '(1 - 2 psi)',
            }
        else:
            return {
                'color': None,
                'range': None,
            }
    return {
        'color': "None",
        'range': "None",
    }


# Will Regulator Work with V-Port
# ------------------------------------------------------------------------------------------------------

def will_work_vp(cap, reg, vp):
    if cap == "N/A":
        return "No"
    else:
        if vp:
            min = 40
        else:
            min = 20
        
        if cap >= (flow_rate * oversizeby) and (cap / min) <= min_flow and body_max121(reg) >= maop:
            return "Yes"
        else:
            return "No"


# Body Size Minimum
# ------------------------------------------------------------------------------------------------------

def body_size_min121(ip, reg):
    if reg == 'R1210813':
        if ip <= 3:
            return '1"'
        elif ip <= 40:
            return '2"'
        elif ip <= 60:
            return '3"'
    elif reg == 'R121081Q':
        if ip <= 5:
            return '1.25"'
        elif ip <= 25:
            return '2"'
        elif ip <= 60:
            return '3"'
    elif reg == 'R121081H':
        if ip <= 40:
            return '1.5"'
        elif ip <= 60:
            return '2"'
    elif reg == 'R1210820':
        if ip <= 40:
            return '2"'
        elif ip <= 60:
            return '3"'
    elif reg == 'R121082H':
        if ip <= 40:
            return '2.5"'
        elif ip <= 60:
            return '3"'
    elif reg == 'R121121H':
        if ip <= 3:
            return '1.5"'
        elif ip <= 15:
            return '2"'
        elif ip <= 60:
            return '3"'
    elif reg == 'R1211220':
        if ip <= 5:
            return '2"'
        elif ip <= 25:
            return '3"'
        elif ip <= 60:
            return '4"'
    elif reg == 'R121122H':
        if ip <= 5:
            return '2.5"'
        elif ip <= 25:
            return '3"'
        elif ip <= 60:
            return '4"'
    elif reg == 'R1211230':
        if ip <= 40:
            return '3"'
    elif reg == 'R1211630':
        if ip <= 5:
            return '3"'
        elif ip <= 15:
            return '4"'
        elif ip <= 40:
            return '6"'
    elif reg == 'R121HP13':
        if ip <= 50:
            return '1"'
        elif ip <= 60:
            return '2"'
    elif reg == 'R121HP1Q':
        if ip <= 40:
            return '1.25"'
        elif ip <= 60:
            return '2"'
    elif reg == 'R121HP1H':
        if ip <= 40:
            return '1.5"'
        elif ip <= 60:
            return '2"'
    elif reg == 'R121HP20':
        if ip <= 40:
            return '2"'
        elif ip <= 60:
            return '3"'
    elif reg == 'R121HP2H':
        if ip <= 40:
            return '2.5"'
        elif ip <= 60:
            return '3"'
    else:
	    return 'None'


# Regulator Match Functions
# ------------------------------------------------------------------------------------------------------

def gen_match121(result121, result122, vp, opp):
    
    match = None

    # monset is the monitor setpoint, will be 0 unless we are sizing for a monitor regulator
    # also set opp type
    monset = 0
    if opp == "Monitor":
        if outlet_input < 1:
            monset = outlet_input + 0.5
        elif outlet_input == 1:
            monset = 2
        elif outlet_input <= 3:
            monset = outlet_input + 1.25
        elif outlet_input <= 8:
            monset = outlet_input + 2
        else:
            monset = 10

    if 'irv_input' in globals():
        if irv_input != 0 and monset > irv_input:
            monset = irv_input

    if vp:

        body_order121 = ['1H', '20', '2H']

        vp_pipe_priority = {
            '1-1/2"': ['1H'],
            '2"':   ['20'],
            '2-1/2"': ['2H'],
        }
        priority_list = vp_pipe_priority.get(pipesize_input, [])
        ordered_body121 = priority_list + [b for b in body_order121 if b not in priority_list]

        model_labels_121 = {
            'R12108': '121-8',
            'R12112': '121-12',
        }


        # -------- 121 Standard only --------
        if outlet_input <= 3:
        
            for prefix, label in model_labels_121.items():
                for body in ordered_body121:
                    reg = f"{prefix}{body}"
                    if reg in result121:
                        cap = result121[reg]
                        if will_work_vp(cap, reg, vp) == "Yes":
                            mon_color = spring_121_122(monset, reg)['color'] if opp == "Monitor" else None
                            if opp == "None" or (opp == "Monitor" and mon_color != None):
                                match = {
                                    'reg': reg,
                                    'model': model_labels_121[prefix],
                                    'diap': None,
                                    'body': body_type121(reg),
                                    'orifice': "V-Port",
                                    'seat': None,
                                    'color': spring_121_122(outlet_input, reg)['color'],
                                    'range': spring_121_122(outlet_input, reg)['range'],
                                    'capacity': cap,
                                    'opp': opp,
                                    'mon_color': mon_color,
                                    'mon_range': spring_121_122(monset, reg)['range'],
                                }
                                return match
        # -------- 121 HP --------    
        else:
            for body in ordered_body121:
                reg = f"R121HP{body}"
                if reg in result121:
                    cap = result121[reg]
                    if will_work_vp(cap, reg, vp) == "Yes":
                        mon_color = spring_121_122(monset, reg)['color'] if opp == "Monitor" else None
                        if opp == "None" or (opp == "Monitor" and mon_color != None):
                            match = {
                                'reg': reg,
                                'model': '121-8-HP',
                                'diap': None,
                                'body': body_type121(reg),
                                'orifice': "V-Port",
                                'seat': None,
                                'color': spring_121_122(outlet_input, reg)['color'],
                                'range': spring_121_122(outlet_input, reg)['range'],
                                'capacity': cap,
                                'opp': opp,
                                'mon_color': mon_color,
                                'mon_range': spring_121_122(monset, reg)['range'],
                            }
                            return match
    
    # NO VP -----------------------------------------------------------
    else:

        body_order121 = ['13', '10', '1Q', '1H', '20', '2H', '30']

        novp_pipe_priority = {
            '3/4"': ['13'],
            '1"':    ['13', '10'],
            '1-1/4"': ['1Q'],
            '1-1/2"':  ['1H'],
            '2"':    ['20'],
            '2-1/2"':  ['2H'],
            '3"':    ['30'],
        }
        priority_list = novp_pipe_priority.get(pipesize_input, [])
        ordered_body121 = priority_list + [b for b in body_order121 if b not in priority_list]

        model_labels_121122 = {
            'R12108': '121-8',
            'R12112': '121-12',
            'R12116': '121-16',
            'R12208': '122-8',
            'R12212': '122-12',
        }

        model_labels_121 = {
            'R12108': '121-8',
            'R12112': '121-12',
            'R12116': '121-16',
        }

        # -------- 121 or 122 Standard --------
        # 122 is used up to 2 psi or 1 psi with monitor
        if ((outlet_input <= 2 and opp == "None") or (outlet_input <= 1 and opp == "Monitor")) and isinstance(result122, str) == False:

            for prefix, label in model_labels_121122.items():
                res = result121 if prefix.startswith('R121') else result122
                for body in ordered_body121:
                    reg = f"{prefix}{body}"
                    if reg in res:
                        cap = res[reg]
                        if will_work_vp(cap, reg, vp) == "Yes":
                            mon_color = spring_121_122(monset, reg)['color'] if opp == "Monitor" else None
                            if opp == "None" or (opp == "Monitor" and mon_color != None):
                                match = {
                                    'reg': reg,
                                    'model': model_labels_121122[prefix],
                                    'diap': None,
                                    'body': body_type121(reg),
                                    'orifice': None,
                                    'seat': None,
                                    'color': spring_121_122(outlet_input, reg)['color'],
                                    'range': spring_121_122(outlet_input, reg)['range'],
                                    'capacity': cap,
                                    'opp': opp,
                                    'mon_color': mon_color,
                                    'mon_range': spring_121_122(monset, reg)['range'],
                                }
                                return match
        
        # -------- 121 Standard only --------
        elif outlet_input <= 3:
        
            for prefix, label in model_labels_121.items():
                for body in ordered_body121:
                    reg = f"{prefix}{body}"
                    if reg in result121:
                        cap = result121[reg]
                        if will_work_vp(cap, reg, vp) == "Yes":
                            mon_color = spring_121_122(monset, reg)['color'] if opp == "Monitor" else None
                            if opp == "None" or (opp == "Monitor" and mon_color != None):
                                match = {
                                    'reg': reg,
                                    'model': model_labels_121[prefix],
                                    'diap': None,
                                    'body': body_type121(reg),
                                    'orifice': None,
                                    'seat': None,
                                    'color': spring_121_122(outlet_input, reg)['color'],
                                    'range': spring_121_122(outlet_input, reg)['range'],
                                    'capacity': cap,
                                    'opp': opp,
                                    'mon_color': mon_color,
                                    'mon_range': spring_121_122(monset, reg)['range'],
                                }
                                return match
        # -------- 121 HP --------    
        else:
            for body in ordered_body121:
                reg = f"R121HP{body}"
                if reg in result121:
                    cap = result121[reg]
                    if will_work_vp(cap, reg, vp) == "Yes":
                        mon_color = spring_121_122(monset, reg)['color'] if opp == "Monitor" else None
                        if opp == "None" or (opp == "Monitor" and mon_color != None):
                            match = {
                                'reg': reg,
                                'model': '121-8-HP',
                                'diap': None,
                                'body': body_type121(reg),
                                'orifice': None,
                                'seat': None,
                                'color': spring_121_122(outlet_input, reg)['color'],
                                'range': spring_121_122(outlet_input, reg)['range'],
                                'capacity': cap,
                                'opp': opp,
                                'mon_color': mon_color,
                                'mon_range': spring_121_122(monset, reg)['range'],
                            }
                            return match

def run_regulator_selection121(inlet, outlet, opp):
    # Select 121 Data Table
    # 121 is used up to 3 psi with or without monitor
    if outlet_input <= 3:
        data_used121 = stddata121
    else:
        data_used121 = hpdata121

    if opp == "Monitor" or opp == "IRV":
        opp = "Monitor"
        monitor = True
        warning = "Sized for worker/monitor setup"
    else:
        opp = "None"
        monitor = False
        warning = None

    vp = False
    result121 = interpolate_capacity(data_used121, inlet, outlet, monitor, False)
    result121_VP = interpolate_capacity(data_used121, inlet, outlet, monitor, True)

    if isinstance(result121, str):
        warning = result121
        result121 = None
        result121_VP = None
        result122 = None
        match = None
        apply = False
        return result121, result121_VP, result122, match, apply, warning

    # 122 can only be used up to 2 psi outlet, 1 psi outlet with monitor
    result122 = interpolate_capacity(stddata122, inlet, outlet, monitor, vp)
        
    match = gen_match121(result121, result122, vp, opp)

    if match:
        apply = True
    else:
        # Try V-Port
        vp = True
        match = gen_match121(result121_VP, result122, vp, opp)

        if match:
            apply = True
        else:
            apply = False

    return result121, result121_VP, result122, match, apply, warning


# Part Number Configurator
# ------------------------------------------------------------------------------------------------------

# Holland Part Number
def hsc_pnc121(match):
    #121
    body_map121 = {
        '3/4" or 1"': '1SCD',
        '1"': '1SCD',
        '1-1/4"': '11/4SCD',
        '1-1/2"': '11/2SCD',
        '2"': '2SCD',
        '2-1/2"': '21/2SCD',
        '3"': '3SCD',
    }    
    #122
    body_map122 = {
        '3/4" or 1"': '1SCD',
        '1"': '1SCD',
        '1-1/4"': '1-1/4SCD',
        '1-1/2"': '1-1/2SCD',
        '2"': '2SCD',
        '2-1/2"': '2-1/2SCD',
        '3"': '3SCD',
    }
    spring_map = {
        'Blue-Black with Black-Red counter': '37',
        'Red-Black': '1',
        'Blue-Black': '2',
        'Green-Black': '3',
        'Green': '12',
        'Orange': '13',
        'Black': '14',
        'Red with counter': '39',
        'Red': '10',
        'Blue': '11',
        'Cadmium': '15',
        'Yellow': '23',
        'Cadmium + White': '21',
        'Blue-black with Black counter': '33',
        'Red with Red-Black counter': '35',
    }

    if match['orifice']:
        vp = 'VPORT'
    else:
        vp = 'STD'

    model = match['model']
    if model == '122-12' or model == '122-8':
        body = body_map122.get(match['body'])
    else:
        body = body_map121.get(match['body'])
    spring = spring_map.get(match['color'])
    monitor_spring = spring_map.get(match['mon_color'])

    if model == '121-16':
        diap = '16'
    elif model == '122-12' or model == '121-12':
        diap = '12'
    elif model == '121-8-HP':
        diap = '8-HP'
    else:
        diap = '8'

    if model == '122-8' or model == '122-12':
        # 122
        if match['opp'] == "Monitor":
            output = {
                'worker': f"R.{model}.STD.{body}.{diap}.INTCON.STD.STD.{spring}.ALU",
                'monitor': f"R.{model}.STD.{body}.{diap}.EXTCON.STD.STD.{monitor_spring}.ALU",
                'controlline': "CONTROL LINE KIT",
                'controllineqty': 1,
            }
        else:
            output = {'worker': f"R.{model}.STD.{body}.{diap}.EXTCON.STD.STD.{spring}.ALU",
                      'controlline': "CONTROL LINE KIT",
                      'controllineqty': 1,
            }
    else:
        # 121
        if match['opp'] == "Monitor":
            output = {
                'worker': f"R.{model}.STD.{body}.{diap}.EXTCON.STD.STD.{vp}.{spring}.ALU",
                'monitor': f"R.{model}.STD.{body}.{diap}.EXTCON.STD.STD.{vp}.{monitor_spring}.ALU",
                'controlline': "CONTROL LINE KIT",
                'controllineqty': 2,
            }
        else:
            output = {'worker': f"R.{model}.STD.{body}.{diap}.EXTCON.STD.STD.{vp}.{spring}.ALU",
                      'controlline': "CONTROL LINE KIT",
                      'controllineqty': 1,
            }

    return output


# Output Functions
# ------------------------------------------------------------------------------------------------------

def print_model_table121(title, prefix, result, vp):
    if vp:
        rows = [
            [body_type121(reg), f"{cap:,.0f}" if isinstance(cap, (int, float)) else cap, will_work_vp(cap, reg, True)]
            for reg, cap in result.items()
            if reg.startswith(prefix) and reg not in ('R1210813', 'R121081Q', 'R1211230', 'R1211630', 'R121HP13', 'R121HP1Q')
        ]
        print("\n" + title)
        print(tabulate(rows, headers=["Body Size", "Calculated Capacity (CFH)", "Will Reg Work"], tablefmt="simple_grid"))
    else:
        rows = [
            [body_type121(reg), f"{cap:,.0f}" if isinstance(cap, (int, float)) else cap, will_work_vp(cap, reg, False)]
            for reg, cap in result.items()
            if reg.startswith(prefix)
        ]
        print("\n" + title)
        print(tabulate(rows, headers=["Body Size", "Calculated Capacity (CFH)", "Will Reg Work"], tablefmt="simple_grid"))

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
