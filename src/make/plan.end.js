/** @copyright Simas Toleikis, 2016 */
"use strict";

const {MCU_Icon} = require("../item");
const {markMapArea} = require("./map");

// Radius of the "mission end" circle (used with player flight only)
const PLAYER_END_CIRCLE_RADIUS = 10000; // 10 km

// Make plan end action
// NOTE: Most flights will end naturally with a "land" action - this special
// end flight action is only used for rare situations - like ending the flight
// prematurely on a route to an offmap airfield, for example.
module.exports = function makePlanEnd(action, element, flight) {
	
	// Use a separate marked check zone area for ending player mission
	if (element.player) {

		markMapArea.call(this, flight, {
			position: action.position,
			perfect: true,
			radius: PLAYER_END_CIRCLE_RADIUS,
			lineType: MCU_Icon.LINE_ZONE_2
		});
		
		// TODO: Add check zone trigger
	}
};