/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
const flightState = DATA.flightState;
const briefingColor = DATA.briefingColor;
const itemFlag = DATA.itemFlag;

// Make plan takeoff action briefing
module.exports = function makeBriefingTakeoff(action, flight) {
	
	const playerElement = this.player.element;
	
	// Ignore take off briefing on air start
	// NOTE: This may happen when the flight state was "start" - but the player element
	// was pushed for air start (due to lack of plane spots or taxi routes for example).
	if (typeof playerElement.state === "number") {
		return;
	}
	
	let briefing = [];
	const airfield = this.airfields[flight.airfield];
	const playerPlaneItem = flight.player.item;
	const taxiRoute = airfield.taxi[Math.abs(flight.taxi)];

	// Add taxi info string only if relevant
	if (taxiRoute && (playerElement.state === flightState.START ||
			playerElement.state === flightState.TAXI)) {
		
		briefing.push("taxi");
		
		// Add taxi direction hint
		if (taxiRoute) {
			
			const taxiPoints = taxiRoute[4];
			let taxiReferencePoint;
			let taxiDistanceReference;
			let taxiDistanceFirst;
			
			// Find taxi hint reference point
			for (let i = 0; i < taxiPoints.length; i++) {

				taxiReferencePoint = taxiPoints[i];

				// Compute distance from taxi reference point to player plane item
				taxiDistanceReference = Math.sqrt(
					Math.pow(playerPlaneItem.XPos - taxiReferencePoint[0], 2) +
					Math.pow(playerPlaneItem.ZPos - taxiReferencePoint[1], 2)
				);

				if (i === 0) {
					taxiDistanceFirst = taxiDistanceReference;
				}

				// NOTE: Try at least 3 taxi points and abort when the distance from
				// the reference point to the player plane item is greater than 100
				// meters. Also abort if we hit taxi runway takeoff point.
				if (i >= 2 && (taxiDistanceReference > 100 || taxiPoints[i][2] === itemFlag.TAXI_RUNWAY)) {
					break;
				}
			}

			// Use runway start point as a taxi hint reference point
			if (taxiDistanceFirst > taxiDistanceReference) {
				taxiReferencePoint = [taxiRoute.takeoffStart[0], taxiRoute.takeoffStart[2]];
			}

			if (taxiReferencePoint) {
				
				let taxiHintOrientation = Math.atan2(
					taxiReferencePoint[1] - playerPlaneItem.ZPos,
					taxiReferencePoint[0] - playerPlaneItem.XPos
				) * (180 / Math.PI);

				let planeHintOrientation = playerPlaneItem.YOri;

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
		briefing.push("(callsign <i>“" + airfield.callsign.name + "”</i>)");
	}

	// Add take off heading/direction
	if (taxiRoute) {
		
		let heading = Math.atan2(
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