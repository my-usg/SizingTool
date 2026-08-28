# ============================================================================
#  USG Model 143 Sizing Tool  |  sizing algorithm (SOURCE OF TRUTH)
#
#  This is "143 Script.py" with the interactive CLI input() prompts and the
#  print() output section removed. Nothing else has been changed: the
#  functions and capacity data below are byte-for-byte the original.
#
#  The module communicates through module-level globals (inlet_input,
#  outlet_input, flow_rate, maop, pipesize_input, opp_type, irv_input,
#  oversizeby, oversize_percent, gastypemult, pload, Patm, result143).
#
#  THIS FILE IS THE SOURCE OF TRUTH. Editing it and pushing is all that is
#  required: CI transpiles it to dist/usg-model-143.js, proves the JavaScript
#  matches this Python on tens of thousands of inputs, and publishes it to the
#  website. Never edit dist/ by hand.
# ============================================================================

#143 REGULATOR

data143 = {
    3.5/28: {
        0.5: {'R14334_58': 510, 'R14334_12': 450, 'R14334_38': 340, 'R14334_56': None, 'R14334_14': None, 'R14334_36': None, 'R14334_18': None, 'R14310_58': 520, 'R14310_12': 460, 'R14310_38': 350, 'R14310_56': None, 'R14310_14': None, 'R14310_36': None, 'R14310_18': None, 'R1431Q_58': 520, 'R1431Q_12': 460, 'R1431Q_38': 350, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': None, 'R1431Q_18': None},
        1: {'R14334_58': 530, 'R14334_12': 510, 'R14334_38': 500, 'R14334_56': 480, 'R14334_14': None, 'R14334_36': None, 'R14334_18': None, 'R14310_58': 650, 'R14310_12': 600, 'R14310_38': 550, 'R14310_56': 480, 'R14310_14': None, 'R14310_36': None, 'R14310_18': None, 'R1431Q_58': 760, 'R1431Q_12': 680, 'R1431Q_38': 550, 'R1431Q_56': 480, 'R1431Q_14': None, 'R1431Q_36': None, 'R1431Q_18': None},
        2: {'R14334_58': 600, 'R14334_12': 580, 'R14334_38': 570, 'R14334_56': 560, 'R14334_14': 530, 'R14334_36': None, 'R14334_18': None, 'R14310_58': 780, 'R14310_12': 880, 'R14310_38': 840, 'R14310_56': 700, 'R14310_14': 530, 'R14310_36': None, 'R14310_18': None, 'R1431Q_58': 1030, 'R1431Q_12': 1020, 'R1431Q_38': 840, 'R1431Q_56': 700, 'R1431Q_14': 530, 'R1431Q_36': None, 'R1431Q_18': None},
        3: {'R14334_58': 670, 'R14334_12': 650, 'R14334_38': 630, 'R14334_56': 620, 'R14334_14': 600, 'R14334_36': 420, 'R14334_18': None, 'R14310_58': 810, 'R14310_12': 920, 'R14310_38': 1000, 'R14310_56': 870, 'R14310_14': 650, 'R14310_36': 420, 'R14310_18': None, 'R1431Q_58': 1050, 'R1431Q_12': 1200, 'R1431Q_38': 1030, 'R1431Q_56': 870, 'R1431Q_14': 650, 'R1431Q_36': 420, 'R1431Q_18': None},
        5: {'R14334_58': 790, 'R14334_12': 770, 'R14334_38': 730, 'R14334_56': 720, 'R14334_14': 700, 'R14334_36': 560, 'R14334_18': 250, 'R14310_58': 970, 'R14310_12': 950, 'R14310_38': 1160, 'R14310_56': 1120, 'R14310_14': 890, 'R14310_36': 580, 'R14310_18': 250, 'R1431Q_58': 1060, 'R1431Q_12': 1490, 'R1431Q_38': 1350, 'R1431Q_56': 1180, 'R1431Q_14': 890, 'R1431Q_36': 580, 'R1431Q_18': 250},
        7.5: {'R14334_58': 900, 'R14334_12': 900, 'R14334_38': 880, 'R14334_56': 860, 'R14334_14': 840, 'R14334_36': 700, 'R14334_18': 310, 'R14310_58': 1060, 'R14310_12': 1140, 'R14310_38': 1270, 'R14310_56': 1340, 'R14310_14': 1140, 'R14310_36': 700, 'R14310_18': 310, 'R1431Q_58': 1060, 'R1431Q_12': 1140, 'R1431Q_38': 1270, 'R1431Q_56': 1340, 'R1431Q_14': 1140, 'R1431Q_36': 700, 'R1431Q_18': 310},
        10: {'R14334_58': 1020, 'R14334_12': 1020, 'R14334_38': 1000, 'R14334_56': 970, 'R14334_14': 950, 'R14334_36': 830, 'R14334_18': 370, 'R14310_58': 1180, 'R14310_12': 1200, 'R14310_38': 1330, 'R14310_56': 1500, 'R14310_14': 1360, 'R14310_36': 840, 'R14310_18': 370, 'R1431Q_58': 1180, 'R1431Q_12': 1800, 'R1431Q_38': 1710, 'R1431Q_56': 1700, 'R1431Q_14': 1360, 'R1431Q_36': 840, 'R1431Q_18': 370},
        20: {'R14334_58': None, 'R14334_12': 1270, 'R14334_38': 1250, 'R14334_56': 1240, 'R14334_14': 1220, 'R14334_36': 1200, 'R14334_18': 530, 'R14310_58': None, 'R14310_12': 1400, 'R14310_38': 1480, 'R14310_56': 1600, 'R14310_14': 2000, 'R14310_36': 1230, 'R14310_18': 530, 'R1431Q_58': None, 'R1431Q_12': 1900, 'R1431Q_38': 1900, 'R1431Q_56': 1800, 'R1431Q_14': 1600, 'R1431Q_36': 1230, 'R1431Q_18': 630},
        40: {'R14334_58': None, 'R14334_12': None, 'R14334_38': 1450, 'R14334_56': 1340, 'R14334_14': 1330, 'R14334_36': 1570, 'R14334_18': 860, 'R14310_58': None, 'R14310_12': None, 'R14310_38': 1900, 'R14310_56': 1640, 'R14310_14': 2000, 'R14310_36': 1700, 'R14310_18': 860, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': 2000, 'R1431Q_56': 1900, 'R1431Q_14': 2200, 'R1431Q_36': 1800, 'R1431Q_18': 860},
        60: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': 1520, 'R14334_36': 1660, 'R14334_18': 1200, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': 2000, 'R14310_36': 1900, 'R14310_18': 1200, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': 2400, 'R1431Q_36': 2100, 'R1431Q_18': 1200},
        80: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 1710, 'R14334_18': 1500, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2000, 'R14310_18': 1540, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2200, 'R1431Q_18': 1550},
        125: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 1900, 'R14334_18': 1800, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2100, 'R14310_18': 2100, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2400, 'R1431Q_18': 2250},
    },
    0.25: {
        0.5: {'R14334_58': 510, 'R14334_12': 450, 'R14334_38': 340, 'R14334_56': None, 'R14334_14': None, 'R14334_36': None, 'R14334_18': None, 'R14310_58': 520, 'R14310_12': 460, 'R14310_38': 350, 'R14310_56': None, 'R14310_14': None, 'R14310_36': None, 'R14310_18': None, 'R1431Q_58': 520, 'R1431Q_12': 460, 'R1431Q_38': 350, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': None, 'R1431Q_18': None},
        1: {'R14334_58': 530, 'R14334_12': 510, 'R14334_38': 500, 'R14334_56': 480, 'R14334_14': None, 'R14334_36': None, 'R14334_18': None, 'R14310_58': 650, 'R14310_12': 600, 'R14310_38': 550, 'R14310_56': 480, 'R14310_14': None, 'R14310_36': None, 'R14310_18': None, 'R1431Q_58': 760, 'R1431Q_12': 680, 'R1431Q_38': 550, 'R1431Q_56': 480, 'R1431Q_14': None, 'R1431Q_36': None, 'R1431Q_18': None},
        2: {'R14334_58': 600, 'R14334_12': 580, 'R14334_38': 570, 'R14334_56': 560, 'R14334_14': 530, 'R14334_36': None, 'R14334_18': None, 'R14310_58': 780, 'R14310_12': 880, 'R14310_38': 840, 'R14310_56': 700, 'R14310_14': 530, 'R14310_36': None, 'R14310_18': None, 'R1431Q_58': 1030, 'R1431Q_12': 1020, 'R1431Q_38': 840, 'R1431Q_56': 700, 'R1431Q_14': 530, 'R1431Q_36': None, 'R1431Q_18': None},
        3: {'R14334_58': 670, 'R14334_12': 650, 'R14334_38': 630, 'R14334_56': 620, 'R14334_14': 600, 'R14334_36': 420, 'R14334_18': None, 'R14310_58': 810, 'R14310_12': 920, 'R14310_38': 1000, 'R14310_56': 870, 'R14310_14': 650, 'R14310_36': 420, 'R14310_18': None, 'R1431Q_58': 1050, 'R1431Q_12': 1200, 'R1431Q_38': 1030, 'R1431Q_56': 870, 'R1431Q_14': 650, 'R1431Q_36': 420, 'R1431Q_18': None},
        5: {'R14334_58': 790, 'R14334_12': 770, 'R14334_38': 730, 'R14334_56': 720, 'R14334_14': 700, 'R14334_36': 560, 'R14334_18': 250, 'R14310_58': 970, 'R14310_12': 950, 'R14310_38': 1160, 'R14310_56': 1120, 'R14310_14': 890, 'R14310_36': 580, 'R14310_18': 250, 'R1431Q_58': 1060, 'R1431Q_12': 1490, 'R1431Q_38': 1350, 'R1431Q_56': 1180, 'R1431Q_14': 890, 'R1431Q_36': 580, 'R1431Q_18': 250},
        7.5: {'R14334_58': 900, 'R14334_12': 900, 'R14334_38': 880, 'R14334_56': 860, 'R14334_14': 840, 'R14334_36': 700, 'R14334_18': 310, 'R14310_58': 1060, 'R14310_12': 1140, 'R14310_38': 1270, 'R14310_56': 1340, 'R14310_14': 1140, 'R14310_36': 700, 'R14310_18': 310, 'R1431Q_58': 1060, 'R1431Q_12': 1140, 'R1431Q_38': 1270, 'R1431Q_56': 1340, 'R1431Q_14': 1140, 'R1431Q_36': 700, 'R1431Q_18': 310},
        10: {'R14334_58': 1020, 'R14334_12': 1020, 'R14334_38': 1000, 'R14334_56': 970, 'R14334_14': 950, 'R14334_36': 830, 'R14334_18': 370, 'R14310_58': 1180, 'R14310_12': 1200, 'R14310_38': 1330, 'R14310_56': 1500, 'R14310_14': 1360, 'R14310_36': 840, 'R14310_18': 370, 'R1431Q_58': 1180, 'R1431Q_12': 1800, 'R1431Q_38': 1710, 'R1431Q_56': 1700, 'R1431Q_14': 1360, 'R1431Q_36': 840, 'R1431Q_18': 370},
        20: {'R14334_58': None, 'R14334_12': 1270, 'R14334_38': 1250, 'R14334_56': 1240, 'R14334_14': 1220, 'R14334_36': 1200, 'R14334_18': 530, 'R14310_58': None, 'R14310_12': 1400, 'R14310_38': 1480, 'R14310_56': 1600, 'R14310_14': 2000, 'R14310_36': 1230, 'R14310_18': 530, 'R1431Q_58': None, 'R1431Q_12': 1900, 'R1431Q_38': 1900, 'R1431Q_56': 1800, 'R1431Q_14': 1600, 'R1431Q_36': 1230, 'R1431Q_18': 630},
        40: {'R14334_58': None, 'R14334_12': None, 'R14334_38': 1450, 'R14334_56': 1340, 'R14334_14': 1330, 'R14334_36': 1570, 'R14334_18': 860, 'R14310_58': None, 'R14310_12': None, 'R14310_38': 1900, 'R14310_56': 1640, 'R14310_14': 2000, 'R14310_36': 1700, 'R14310_18': 860, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': 2000, 'R1431Q_56': 1900, 'R1431Q_14': 2200, 'R1431Q_36': 1800, 'R1431Q_18': 860},
        60: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': 1520, 'R14334_36': 1660, 'R14334_18': 1200, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': 2000, 'R14310_36': 1900, 'R14310_18': 1200, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': 2400, 'R1431Q_36': 2100, 'R1431Q_18': 1200},
        80: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 1710, 'R14334_18': 1500, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2000, 'R14310_18': 1540, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2200, 'R1431Q_18': 1550},
        125: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 1900, 'R14334_18': 1800, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2100, 'R14310_18': 2100, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2400, 'R1431Q_18': 2250},
    },
	2.0: {	
        5: {'R14334_58': 1100, 'R14334_12': 925, 'R14334_38': 700, 'R14334_56': 600, 'R14334_14': 470, 'R14334_36': 370, 'R14334_18': 220, 'R14310_58': 1150, 'R14310_12': 975, 'R14310_38': 725, 'R14310_56': 600, 'R14310_14': 500, 'R14310_36': 380, 'R14310_18': 220, 'R1431Q_58': 1175, 'R1431Q_12': 1050, 'R1431Q_38': 750, 'R1431Q_56': 600, 'R1431Q_14': 500, 'R1431Q_36': 380, 'R1431Q_18': 220},
        10: {'R14334_58': 1600, 'R14334_12': 1350, 'R14334_38': 1100, 'R14334_56': 1000, 'R14334_14': 800, 'R14334_36': 600, 'R14334_18': 325, 'R14310_58': 1650, 'R14310_12': 1550, 'R14310_38': 1250, 'R14310_56': 1050, 'R14310_14': 850, 'R14310_36': 625, 'R14310_18': 325, 'R1431Q_58': 1750, 'R1431Q_12': 1700, 'R1431Q_38': 1350, 'R1431Q_56': 1050, 'R1431Q_14': 850, 'R1431Q_36': 675, 'R1431Q_18': 250},
        20: {'R14334_58': None, 'R14334_12': 1800, 'R14334_38': 1500, 'R14334_56': 1400, 'R14334_14': 1150, 'R14334_36': 975, 'R14334_18': 550, 'R14310_58': None, 'R14310_12': 2100, 'R14310_38': 2050, 'R14310_56': 1800, 'R14310_14': 1475, 'R14310_36': 1100, 'R14310_18': 550, 'R1431Q_58': None, 'R1431Q_12': 2400, 'R1431Q_38': 2200, 'R1431Q_56': 1950, 'R1431Q_14': 1700, 'R1431Q_36': 1100, 'R1431Q_18': 550},
        40: {'R14334_58': None, 'R14334_12': None, 'R14334_38': 1850, 'R14334_56': 1700, 'R14334_14': 1450, 'R14334_36': 1200, 'R14334_18': 900, 'R14310_58': None, 'R14310_12': None, 'R14310_38': 2500, 'R14310_56': 2200, 'R14310_14': 2200, 'R14310_36': 1500, 'R14310_18': 900, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': 2600, 'R1431Q_56': 2400, 'R1431Q_14': 2600, 'R1431Q_36': 1950, 'R1431Q_18': 900},
        60: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': 1825, 'R14334_36': 1650, 'R14334_18': 1100, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': 2500, 'R14310_36': 2050, 'R14310_18': 1125, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': 2600, 'R1431Q_36': 2600, 'R1431Q_18': 1125},
        100: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 2200, 'R14334_18': 1550, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2600, 'R14310_18': 1850, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2600, 'R1431Q_18': 1850},
        125: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 2200, 'R14334_18': 1850, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2600, 'R14310_18': 2150, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2600, 'R1431Q_18': 2150},
    },
	6.0: {	
        5: {'R14334_58': 1100, 'R14334_12': 925, 'R14334_38': 700, 'R14334_56': 600, 'R14334_14': 470, 'R14334_36': 370, 'R14334_18': 220, 'R14310_58': 1150, 'R14310_12': 975, 'R14310_38': 725, 'R14310_56': 600, 'R14310_14': 500, 'R14310_36': 380, 'R14310_18': 220, 'R1431Q_58': 1175, 'R1431Q_12': 1050, 'R1431Q_38': 750, 'R1431Q_56': 600, 'R1431Q_14': 500, 'R1431Q_36': 380, 'R1431Q_18': 220},
        10: {'R14334_58': 1600, 'R14334_12': 1350, 'R14334_38': 1100, 'R14334_56': 1000, 'R14334_14': 800, 'R14334_36': 600, 'R14334_18': 325, 'R14310_58': 1650, 'R14310_12': 1550, 'R14310_38': 1250, 'R14310_56': 1050, 'R14310_14': 850, 'R14310_36': 625, 'R14310_18': 325, 'R1431Q_58': 1750, 'R1431Q_12': 1700, 'R1431Q_38': 1350, 'R1431Q_56': 1050, 'R1431Q_14': 850, 'R1431Q_36': 675, 'R1431Q_18': 250},
        20: {'R14334_58': None, 'R14334_12': 1800, 'R14334_38': 1500, 'R14334_56': 1400, 'R14334_14': 1150, 'R14334_36': 975, 'R14334_18': 550, 'R14310_58': None, 'R14310_12': 2100, 'R14310_38': 2050, 'R14310_56': 1800, 'R14310_14': 1475, 'R14310_36': 1100, 'R14310_18': 550, 'R1431Q_58': None, 'R1431Q_12': 2400, 'R1431Q_38': 2200, 'R1431Q_56': 1950, 'R1431Q_14': 1700, 'R1431Q_36': 1100, 'R1431Q_18': 550},
        40: {'R14334_58': None, 'R14334_12': None, 'R14334_38': 1850, 'R14334_56': 1700, 'R14334_14': 1450, 'R14334_36': 1200, 'R14334_18': 900, 'R14310_58': None, 'R14310_12': None, 'R14310_38': 2500, 'R14310_56': 2200, 'R14310_14': 2200, 'R14310_36': 1500, 'R14310_18': 900, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': 2600, 'R1431Q_56': 2400, 'R1431Q_14': 2600, 'R1431Q_36': 1950, 'R1431Q_18': 900},
        60: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': 1825, 'R14334_36': 1650, 'R14334_18': 1100, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': 2500, 'R14310_36': 2050, 'R14310_18': 1125, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': 2600, 'R1431Q_36': 2600, 'R1431Q_18': 1125},
        100: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 2200, 'R14334_18': 1550, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2600, 'R14310_18': 1850, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2600, 'R1431Q_18': 1850},
        125: {'R14334_58': None, 'R14334_12': None, 'R14334_38': None, 'R14334_56': None, 'R14334_14': None, 'R14334_36': 2200, 'R14334_18': 1850, 'R14310_58': None, 'R14310_12': None, 'R14310_38': None, 'R14310_56': None, 'R14310_14': None, 'R14310_36': 2600, 'R14310_18': 2150, 'R1431Q_58': None, 'R1431Q_12': None, 'R1431Q_38': None, 'R1431Q_56': None, 'R1431Q_14': None, 'R1431Q_36': 2600, 'R1431Q_18': 2150},
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


# Will Regulator Work
# ------------------------------------------------------------------------------------------------------

def will_work(cap, reg, orifice_max):
    if cap == "N/A":
        return "No"
    else:
        if cap >= (flow_rate * oversizeby) and orifice_max >= maop:
            return "Yes"
        else:
            return "No"


# Orifice Types & MAOP Function
# ------------------------------------------------------------------------------------------------------

def orifice_type143(reg):
    suf = reg[-2:]
    if suf == "18":
        return '1/8"'
    elif suf == "36":
        return '3/16"'
    elif suf == "14":
        return '1/4"'
    elif suf == "56":
        return '5/16"'
    elif suf == "38":
        return '3/8"'
    elif suf == "12":
        return '1/2"'
    elif suf == '58':
        return '5/8"'

def orifice_max143(reg):
    suf = reg[-2:]
    if suf == "18":
        return 125
    elif suf == "36":
        return 125
    elif suf == "14":
        return 60
    elif suf == "56":
        return 40
    elif suf == "38":
        return 40
    elif suf == "12":
        return 20
    elif suf == '58':
        return 10


# Spring Selections
# ------------------------------------------------------------------------------------------------------

def spring_143(op):
    if op < 6.5/28 and op >= 3.5/28:
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
            'range': '(12" - 28" wc)',
        }
    elif op <= 2:
        return {
            'color': 'Black + White',
            'range': '(0.5 - 2 psi)',
        }
    elif op < 3:
        return {
            'color': 'Cadmium',
            'range': '(0.5 - 3 psi)',
        }
    elif op <= 6:
        return {
            'color': 'Black',
            'range': '(2 - 6 psi)',
        }
    

# Will IRV Work
# ------------------------------------------------------------------------------------------------------

def will_irv_work143(reg, opp):

    # Partial IRV
    if opp == "Partial":
        return "Partial"
     
    irvstddata143 = {
        0: {'18': 0.25, '36': 0.25, '14': 0.25, '56': 0.25, '38': 0.25, '12': None, '58': None},
        10: {'18': 0.25, '36': 0.35, '14': 0.5, '56': 0.75, '38': 1, '12': None, '58': None},
        17: {'18': 0.25, '36': 0.5, '14': 0.65, '56': 1.05, '38': 1.75, '12': None, '58': None},
        20: {'18': 0.35, '36': 0.5, '14': 0.75, '56': 1.25, '38': None, '12': None, '58': None},
        30: {'18': 0.35, '36': 0.55, '14': 1.05, '56': 1.75, '38': None, '12': None, '58': None},
        40: {'18': 0.35, '36': 0.75, '14': 1.45, '56': None, '38': None, '12': None, '58': None},
        50: {'18': 0.45, '36': 0.95, '14': 1.85, '56': None, '38': None, '12': None, '58': None},
        60: {'18': 0.5, '36': 1.05, '14': 2.25, '56': None, '38': None, '12': None, '58': None},
        70: {'18': 0.5, '36': 1.25, '14': None, '56': None, '38': None, '12': None, '58': None},
        80: {'18': 0.55, '36': 1.5, '14': None, '56': None, '38': None, '12': None, '58': None},
        90: {'18': 0.65, '36': 1.75, '14': None, '56': None, '38': None, '12': None, '58': None},
        100: {'18': 0.75, '36': 2, '14': None, '56': None, '38': None, '12': None, '58': None},
        110: {'18': None, '36': None, '14': None, '56': None, '38': None, '12': None, '58': None},
        120: {'18': None, '36': None, '14': None, '56': None, '38': None, '12': None, '58': None},
        125: {'18': None, '36': None, '14': None, '56': None, '38': None, '12': None, '58': None},
    }

    irvhpdata143 = {
        3: {'18': 0, '36': 0, '14': 0.4, '56': 0.8, '38': 0.8, '12': 0.8, '58': 0.8},
        4: {'18': 0.2, '36': 0.8, '14': 0.8, '56': 0.8, '38': 1, '12': 1, '58': 1},
        5: {'18': 0.6, '36': 0.9, '14': 0.9, '56': 0.9, '38': 1.1, '12': 1.3, '58': 1.4},
        6: {'18': 0.8, '36': 0.9, '14': 0.9, '56': 1, '38': 1.2, '12': 1.4, '58': 1.6},
        10: {'18': 0.8, '36': 0.9, '14': 1, '56': 1.2, '38': 1.6, '12': 2, '58': 2.8},
        14: {'18': 0.9, '36': 0.9, '14': 1.2, '56': 1.5, '38': 2, '12': 3, '58': 4},
        18: {'18': 0.9, '36': 1, '14': 1.3, '56': 1.8, '38': 2.6, '12': 4, '58': None},
        20: {'18': 0.9, '36': 1, '14': 1.3, '56': 1.9, '38': 2.7, '12': None, '58': None},
        30: {'18': 0.9, '36': 1.2, '14': 1.7, '56': 2.6, '38': 4, '12': None, '58': None},
        40: {'18': 1, '36': 1.3, '14': 2, '56': 3.4, '38': None, '12': None, '58': None},
        46: {'18': 1, '36': 1.4, '14': 2.3, '56': 4, '38': None, '12': None, '58': None},
        50: {'18': 1, '36': 1.4, '14': 2.5, '56': None, '38': None, '12': None, '58': None},
        60: {'18': 1.1, '36': 1.6, '14': 3, '56': None, '38': None, '12': None, '58': None},
        70: {'18': 1.2, '36': 1.9, '14': 3.5, '56': None, '38': None, '12': None, '58': None},
        78: {'18': 1.2, '36': 2.1, '14': 4, '56': None, '38': None, '12': None, '58': None},
        80: {'18': 1.2, '36': 2.1, '14': None, '56': None, '38': None, '12': None, '58': None},
        90: {'18': 1.3, '36': 2.3, '14': None, '56': None, '38': None, '12': None, '58': None},
        100: {'18': 1.4, '36': 2.6, '14': None, '56': None, '38': None, '12': None, '58': None},
        110: {'18': 1.4, '36': 2.8, '14': None, '56': None, '38': None, '12': None, '58': None},
        120: {'18': 1.5, '36': 3, '14': None, '56': None, '38': None, '12': None, '58': None},
        125: {'18': 1.6, '36': 3.2, '14': None, '56': None, '38': None, '12': None, '58': None},
    }

    # Linear Interpolaton Algorithm to determine the outlet pressure buildup for a given inlet pressure and orifice
    irv_table = irvstddata143 if outlet_input <= 0.5 else irvhpdata143
    orifice_key = reg[-2:]
    inlet_keys = sorted(irv_table.keys())
    if inlet_input <= inlet_keys[0]:
        out_pressure_build = irv_table[inlet_keys[0]][orifice_key]
    elif inlet_input >= inlet_keys[-1]:
        out_pressure_build = irv_table[inlet_keys[-1]][orifice_key]
    else:
        p_low = max(p for p in inlet_keys if p <= inlet_input)
        p_high = min(p for p in inlet_keys if p >= inlet_input)
        if p_low == p_high:
            out_pressure_build = irv_table[p_low][orifice_key]
        else:
            v_low = irv_table[p_low][orifice_key]
            v_high = irv_table[p_high][orifice_key]
            if v_low is None or v_high is None:
                out_pressure_build = None
            else:
                t = (inlet_input - p_low) / (p_high - p_low)
                out_pressure_build = (1 - t) * v_low + t * v_high

    if out_pressure_build == None or irv_input == None:
        return "No"
    elif (out_pressure_build + outlet_input) <= irv_input:
        return "Yes"
    else:
        return "No"


# Regulator Match Functions
# ------------------------------------------------------------------------------------------------------

def gen_match143(result, opp):
    match = None

    if outlet_input > 2:
        model = '143-2HP'
    elif opp == "None":
        model = '143-1'
    else:
        model = '143-2'

    body_labels143 = {
        'R14334': '3/4"',
        'R14310': '1"',
        'R1431Q': '1-1/4"',
    }

    pipe_priority = {
        '3/4"': 'R14334',
        '1"':    'R14310',
        '1-1/4"': 'R1431Q',
    }

    all_prefixes = list(body_labels143.keys())
    prioritized = pipe_priority.get(pipesize_input)
    if prioritized:
        ordered_prefixes = [prioritized] + [p for p in all_prefixes if p != prioritized]
    else:
        ordered_prefixes = all_prefixes

    # largest to smallest orifices
    orifice_order143 = ['58', '12', '38', '56', '14', '36', '18']

    # IRV
    if opp == "IRV" or opp == "Partial":
        for prefix in ordered_prefixes:
            for orifice in orifice_order143:
                reg = f"{prefix}_{orifice}"
                if reg in result:
                    cap = result[reg]
                    if will_work(cap, reg, orifice_max143(reg)) == "Yes" and will_irv_work143(reg, opp) != "No":
                        match = {
                            'reg' : reg,
                            'model': model,
                            'diap': None,
                            'body': body_labels143[prefix],
                            'orifice': orifice_type143(reg),
                            'seat': None,
                            'color': spring_143(outlet_input)['color'],
                            'range': spring_143(outlet_input)['range'],
                            'capacity': cap,
                            'opp': "IRV",
                            'mon_color': None,
                            'mon_range': None,
                        }
                        return match
    # No OPP
    else:
        for prefix in ordered_prefixes:
            for orifice in orifice_order143:
                reg = f"{prefix}_{orifice}"
                if reg in result:
                    cap = result[reg]
                    if will_work(cap, reg, orifice_max143(reg)) == "Yes":
                        match = {
                            'reg' : reg,
                            'model': model,
                            'diap': None,
                            'body': body_labels143[prefix],
                            'orifice': orifice_type143(reg),
                            'seat': None,
                            'color': spring_143(outlet_input)['color'],
                            'range': spring_143(outlet_input)['range'],
                            'capacity': cap,
                            'opp': "None" if model == '143-1' else "IRV",
                            'mon_color': None,
                            'mon_range': None,
                        }
                        return match


def run_regulator_selection143(inlet, outlet, opp):

    opp = "IRV" if opp == "Monitor" else opp
    
    # if opp = IRV, fail if outlet > 2 psi (for 143-2HP)
    if opp == "IRV" and outlet_input > 2:
        warning = "Cannot size IRV for outlet pressures > 2 psi"
        result = None
        match = None
        apply = False
        return result, match, apply, warning
    
    result = interpolate_capacity(data143, inlet, outlet, False, False)

    warning = None

    if isinstance(result, str):
        warning = result
        result = None
        match = None
        apply = False
        return result, match, apply, warning

    match = gen_match143(result, opp)

    if match:
        apply = True
        if opp == "IRV":
            warning = "Sized for IRV"
    else:
        apply = False

    return result, match, apply, warning


# Part Number Configurator
# ------------------------------------------------------------------------------------------------------

# Holland Part Number
def hsc_pnc143(match):
    body_map = {
        '3/4"': '3/4',
        '1"': '1',
        '1-1/4"': '1-1/4',
    }
    orifice_map = {
        '1/8"': '10',
        '3/16"': '11',
        '1/4"': '12',
        '5/16"': '13',
        '3/8"': '14',
        '1/2"': '15',
        '5/8"': '16',
    }
    spring_map = {
        'Red': '10',
        'Blue': '11',
        'Green': '12',
        'Orange': '13',
        'Black + White': '20',
        'Cadmium': '15',
        'Black': '14',
    }

    model = match['model']
    body = body_map.get(match['body'])
    orifice = orifice_map.get(match['orifice'])
    spring = spring_map.get(match['color'])

    output = {'worker': f"R.{model}.{body}.{orifice}.{spring}"}

    return output


# Output Functions
# ------------------------------------------------------------------------------------------------------

def print_model_table(title, prefix, opp, result):
    
    if opp == "IRV":
        rows = [
            [orifice_type143(reg), f"{cap:,.0f}" if isinstance(cap, (int, float)) else cap, will_work(cap, reg, orifice_max143(reg)), will_irv_work143(reg, opp)]
            for reg, cap in result.items()
            if reg.startswith(prefix)
        ]
        print("\n" + title)
        print(tabulate(rows, headers=["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work", "Will IRV Work?"], tablefmt="simple_grid"))
    else:
        rows = [
            [orifice_type143(reg), f"{cap:,.0f}" if isinstance(cap, (int, float)) else cap, will_work(cap, reg, orifice_max143(reg))]
            for reg, cap in result143.items()
            if reg.startswith(prefix)
        ]
        print("\n" + title)
        print(tabulate(rows, headers=["Orifice Size", "Calculated Capacity (CFH)", "Will Reg Work"], tablefmt="simple_grid"))

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
