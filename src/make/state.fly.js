/** @copyright Simas Toleikis, 2016 */
"use strict";

const {Vector} = require("sylvester");
const makeFlightFuel = require("./flight.fuel");
const {getRouteDistance} = require("./flight.route");

// Minimum distance required between start position and the next spot
const MIN_SPOT_DISTANCE = 5000; // 5 Km

// Make plan fly state
module.exports = function makePlanFlyState(flight, action, state) {

	const plan = flight.plan;
	const route = action.route;
	let startPosition = plan.start.position;
	const routeDistance = getRouteDistance(startPosition, route);
	let removeAction = false;

	// Forward full fly plan action
	if (state >= 1) {

		removeAction = true;
		startPosition = route.pop().position;
	}
	// Forward partial fly plan action
	else {

		let pendingDistance = routeDistance * state;

		// Process route spots
		for (;;) {

			const spot = route[0];
			const spotVector = Vector.create(spot.position);
			const startVector = Vector.create(startPosition);
			const spotDistance = startVector.distanceFrom(spotVector);

			pendingDistance -= spotDistance;

			// Skip entire spot
			if (pendingDistance >= 0) {

				route.shift();
				startPosition = spot.position;
			}
			// Find new fast-forwarded start position
			else {

				startPosition = startVector.add(
					spotVector
						.subtract(startVector)
						.toUnitVector()
						.multiply(spotDistance + pendingDistance)
				).elements;

				// Skip next spot if it's too close to new start position
				if (Math.abs(pendingDistance) < MIN_SPOT_DISTANCE) {
					route.shift();
				}

				// Remove entire action
				if (!route.length) {
					removeAction = true;
				}

				break;
			}
		}
	}

	// Use flight fuel for fast-forward travel distance
	makeFlightFuel.call(this, flight, routeDistance * state);

	// Set new flight start position
	plan.start.position = startPosition;

	// Remove action from plan
	if (removeAction) {
		plan.splice(plan.indexOf(action), 1);
	}
};