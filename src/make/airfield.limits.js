/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemTag = DATA.itemTag;
var itemFlag = DATA.itemFlag;

// Make airfield limits
module.exports = function makeAirfieldLimits(airfield) {

	var limits = Object.create(null);
	var value = airfield.value || 0;
	var rand = this.rand;
	var time = this.time;
	var round = Math.round;
	var min = Math.min;
	var max = Math.max;
	var isDark = (time.evening || time.night || time.dawn);

	// Special items
	limits[itemTag.TRUCK_CARGO] = 0;
	limits[itemTag.TRUCK_FUEL] = 0;
	limits[itemTag.CAR] = 0;
	limits[itemTag.AA_MG] = 0;
	limits[itemTag.AA_FLAK] = 0;
	limits[itemTag.LIGHT_SEARCH] = 0;

	// Effects
	limits.effects = Object.create(null);
	limits.effects[itemFlag.EFFECT_SMOKE] = 0;
	limits.effects[itemFlag.EFFECT_CAMP] = 0;

	// Vehicle routes
	limits.routes = 0;

	if (value > 0) {

		// TODO: Modify TRUCK_CARGO and TRUCK_FUEL limits based on mission complexity param
		limits[itemTag.TRUCK_CARGO] = round(min(max(value / 10, 4), 24));
		limits[itemTag.TRUCK_FUEL] = round(min(max(value / 20, 2), 12));

		// Anti-aircraft vehicle limits
		limits[itemTag.AA_MG] = round(min(max(value / (time.night ? 37.5 : 25), 2), 7));
		limits[itemTag.AA_FLAK] = round(min(max(value / (time.night ? 60 : 40), 0), 5));

		// Only add search lights for dark time periods
		if (isDark) {
			limits[itemTag.LIGHT_SEARCH] = round(min(max(value / 40, 0), 4));
		}

		// Only max one staff car per airfield
		limits[itemTag.CAR] = 1;

		// Smoke and campfire effect limits
		limits.effects[itemFlag.EFFECT_SMOKE] = round(min(max(value / 30, 1), 3));
		limits.effects[itemFlag.EFFECT_CAMP] = round(min(max(value / 50, 1), 2));

		// 50% chance for a single vehicle route during dark time periods
		if (isDark) {
			limits.routes = rand.integer(0, 1);
		}
		// Normal vehicle route limits during light time periods
		else {
			limits.routes = min(max(round(value / 28), 1), 5);
		}
	}

	// TODO: Add BLOCK_DECO item limits (based on mission complexity param)

	airfield.limits = limits;
};