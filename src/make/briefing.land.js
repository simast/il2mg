/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
var briefingColor = DATA.briefingColor;

// Make plan land action briefing
module.exports = function makeBriefingLand(action, flight) {
	
	var briefing = [];
	var airfield = this.airfields[action.airfield || flight.airfield];
	var playerElement = this.player.element;
	var taxiRoute = airfield.taxi[action.taxi || Math.abs(flight.taxi)];
	
	briefing.push("Land at");
	
	// Show airfield name (when target airfield is different or with air start)
	if (airfield.id !== flight.airfield || typeof playerElement.state === "number") {
		briefing.push('<font color="' + briefingColor.LIGHT + '">' + airfield.name + "</font>");
	}
	// Hide airfield name (should be already visibile in take off plan action briefing)
	else {
		briefing.push("the");
	}
	
	briefing.push("airfield");
	
	// Target airfield callsign
	if (airfield.callsign && (airfield.id !== flight.airfield || typeof playerElement.state === "number")) {
		briefing.push("(callsign <i>“" + airfield.callsign.name + "”</i>)");
	}

	// Add landing heading/direction
	if (taxiRoute && (airfield.id !== flight.airfield || typeof playerElement.state === "number")) {
		
		var heading = Math.atan2(
			taxiRoute.takeoffEnd[2] - taxiRoute.takeoffStart[2],
			taxiRoute.takeoffEnd[0] - taxiRoute.takeoffStart[0]
		) * (180 / Math.PI);
		
		heading = Math.round((heading + 360) % 360);
		heading = ("000" + heading).substr(-3, 3);
		
		briefing.push("heading " + heading);
		
		// TODO: Add info about parking area location (to your left/right/forward)
	}
	
	briefing.push("and taxi to the parking area");
	
	return briefing.join(" ") + ".";
};