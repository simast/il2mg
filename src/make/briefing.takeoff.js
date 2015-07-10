/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
var flightState = DATA.flightState;
var briefingColor = DATA.briefingColor;

// Make plan takeoff action briefing
module.exports = function makeBriefingTakeoff(action, flight) {
	
	// TODO: "Taxi to your left and take off from Oblivskaya airfield heading 083."
	
	var briefing = [];
	var airfield = this.airfieldsByID[flight.airfield];
	var playerElement = flight.elements[0];
	var taxiRoute = airfield.taxi[flight.taxi];
	
	// Find player element
	for (var element of flight.elements) {
		
		if (element.player) {
			
			playerElement = element;
			break;
		}
	}
	
	// Find closest taxi route as a reference for player-only taxi start position
	if (!taxiRoute && flight.taxi === 0) {
		
		// TODO: Find closest active taxi route (in range of 100 meters)
		var activeTaxiRoutes = airfield.activeTaxiRoutes;
	}
	
	// Add taxi info string only if relevant
	if (flight.taxi !== undefined && playerElement.state !== flightState.RUNWAY &&
			typeof playerElement.state !== "number") {
		
		briefing.push("taxi");
		
		// TODO: Compute initial taxi direction
		
		briefing.push("and");
	}
	
	briefing.push("take off from");
	briefing.push('<font color="' + briefingColor.LIGHT + '">' + airfield.name + "</font>");
	briefing.push("airfield");
	
	// Airfield callsign
	if (airfield.callsign) {
		briefing.push("(callsign <i>“" + airfield.callsign[1] + "”</i>)");
	}

	// Compute take off heading
	if (taxiRoute) {
		
		var heading = Math.atan2(
			taxiRoute.takeoffEnd[2] - taxiRoute.takeoffStart[2],
			taxiRoute.takeoffEnd[0] - taxiRoute.takeoffStart[0]
		) * (180 / Math.PI);
		
		heading = Math.round((heading + 360) % 360);
		heading = ("000" + heading).substr(-3, 3);
		
		briefing.push("heading " + heading);
	}
	
	briefing = briefing.join(" ") + ".";
	briefing = briefing.charAt(0).toUpperCase() + briefing.slice(1);

	return briefing;
};