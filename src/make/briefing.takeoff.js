/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
var flightState = DATA.flightState;
var briefingColor = DATA.briefingColor;
var itemFlag = DATA.itemFlag;

// Make plan takeoff action briefing
module.exports = function makeBriefingTakeoff(action, flight) {
	
	var briefing = [];
	var airfield = this.airfieldsByID[flight.airfield];
	var playerElement = flight.elements[0];
	var playerPlaneItem = flight.player.item;
	var taxiRoute = airfield.taxi[flight.taxi];

	// Find player element
	for (var element of flight.elements) {

		if (element.player) {

			playerElement = element;
			break;
		}
	}

	// Add taxi info string only if relevant
	if (taxiRoute && (playerElement.state === flightState.START ||
			playerElement.state === flightState.TAXI)) {
		
		briefing.push("taxi");
		
		// Add taxi direction hint
		if (taxiRoute) {
			
			var taxiPoints = taxiRoute[4];
			var taxiReferencePoint;
			var taxiDistanceReference;
			var taxiDistanceFirst;
			
			// Find taxi hint reference point
			for (var i = 0; i < taxiPoints.length; i++) {

				taxiReferencePoint = taxiPoints[i];

				// Compute distance from taxi reference point to player plane item
				taxiDistanceReference = Math.sqrt(
					Math.pow(playerPlaneItem.XPos - taxiReferencePoint[0], 2) +
					Math.pow(playerPlaneItem.ZPos - taxiReferencePoint[1], 2)
				);

				if (i === 0) {
					taxiDistanceFirst = taxiDistanceReference;
				}

				// NOTE: Try at least 2 taxi points and abort when the distance from
				// the reference point to the player plane item is greater than 100
				// meters. Also abort if we hit taxi runway takeoff point.
				if (i >= 1 && (taxiDistanceReference > 100 || taxiPoints[i][2] === itemFlag.TAXI_RUNWAY)) {
					break;
				}
			}

			// Use runway start point as a taxi hint reference point
			if (taxiDistanceFirst > taxiDistanceReference) {
				taxiReferencePoint = [taxiRoute.takeoffStart[0], taxiRoute.takeoffStart[2]];
			}

			if (taxiReferencePoint) {
				
				var taxiHintOrientation = Math.atan2(
					taxiReferencePoint[1] - playerPlaneItem.ZPos,
					taxiReferencePoint[0] - playerPlaneItem.XPos
				) * (180 / Math.PI);

				var planeHintOrientation = playerPlaneItem.YOri;

				if (planeHintOrientation > 180) {
					planeHintOrientation -= 360;
				}

				taxiHintOrientation -= planeHintOrientation;

				// Normalize taxi hint orientation from -180 to +180 range
				if (taxiHintOrientation < -180) {
					taxiHintOrientation += 360;
				}
				else if (taxiHintOrientation > 180) {
					taxiHintOrientation -= 360;
				}

				// Forward direction from -25 to +25 orientation
				if (Math.abs(taxiHintOrientation) <= 25) {
					briefing.push("forward");
				}
				// Left direction from -25 to -150
				else if (taxiHintOrientation < -25 && taxiHintOrientation > -150) {
					briefing.push("to your left");
				}
				// Right direction from +25 to +150
				else if (taxiHintOrientation > 25 && taxiHintOrientation < 150) {
					briefing.push("to your right");
				}
			}
		}
		
		briefing.push("and");
	}
	
	briefing.push("take off from");
	briefing.push('<font color="' + briefingColor.LIGHT + '">' + airfield.name + "</font>");
	briefing.push("airfield");
	
	// Airfield callsign
	if (airfield.callsign) {
		briefing.push("(callsign <i>“" + airfield.callsign[1] + "”</i>)");
	}

	// Add take off heading/direction
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