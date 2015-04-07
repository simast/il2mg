/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemTags = require("./").itemTags;
var itemFlags = require("./").itemFlags;

// Make airfield limits
module.exports = function makeAirfieldLimits(airfield) {

	var limits = Object.create(null);
	var value = airfield.value || 0;
	var time = this.time;
	var round = Math.round;
	var min = Math.min;
	var max = Math.max;

	// Special items
	limits[itemTags.TRUCK_CARGO] = 0;
	limits[itemTags.TRUCK_FUEL] = 0;
	limits[itemTags.CAR] = 0;
	limits[itemTags.AA_MG] = 0;
	limits[itemTags.AA_FLAK] = 0;
	limits[itemTags.LIGHT_SEARCH] = 0;

	// Effects
	limits.effects = Object.create(null);
	limits.effects[itemFlags.EFFECT_SMOKE] = 0;
	limits.effects[itemFlags.EFFECT_CAMP] = 0;

	// Vehicle routes
	limits.routes = 0;

	if (value > 0) {

		// TODO: Modify TRUCK_CARGO and TRUCK_FUEL limits based on mission complexity param
		limits[itemTags.TRUCK_CARGO] = round(min(max(value / 10, 4), 24));
		limits[itemTags.TRUCK_FUEL] = round(min(max(value / 20, 2), 12));

		// Anti-aircraft vehicle limits
		limits[itemTags.AA_MG] = round(min(max(value / 25, 2), 7));
		limits[itemTags.AA_FLAK] = round(min(max(value / 40, 0), 5));

		// Only add search lights for night time periods
		if (time.evening || time.night || time.dawn) {
			limits[itemTags.LIGHT_SEARCH] = round(min(max(value / 40, 0), 4));
		}

		// Only max one staff car per airfield
		limits[itemTags.CAR] = 1;

		// Smoke and campfire effect limits
		limits.effects[itemFlags.EFFECT_SMOKE] = round(min(max(value / 30, 1), 3));
		limits.effects[itemFlags.EFFECT_CAMP] = round(min(max(value / 50, 1), 2));

		// Vehicle route limits
		limits.routes = min(max(round(value / 28), 1), 5);
	}

	// TODO: Add BLOCK_DECO item limits (based on mission complexity param)

	airfield.limits = limits;
};