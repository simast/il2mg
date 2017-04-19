/** @copyright Simas Toleikis, 2017 */
"use strict";

const makeFlightState = require("./flight.state");
const makeFlightTime = require("./flight.time");

// Virtual activity zone size as inner and outer circle (km)
// NOTE: Two activity zones/circles are used to make sure virtual flights do not
// activate while on top of the player position. They will only activate when
// the player is farther than the inner zone and inside the outer zone.
// NOTE: Current max in-game draw distance for aircraft is 10 km!
const VIRTUAL_ZONE_INNER = 10000;
const VIRTUAL_ZONE_OUTER = 20000;

// Make virtual flight
module.exports = function makeFlightVirtual(flight) {

	if (!flight.virtual) {
		return;
	}

	/*
		1. Get virtual points for each activity (use makeVirtualPoints)
		2. Use makeFlightState to create virtual flights (needs state step)
		3. Use flight.time to delay virtual flight point activation
		4. Use makeFlightActions to re-attach virtual flight to plan actions
		5. Use makeFlightTime to update flight time
		6. Use makeFlightPose to position virtual flight
	*/

	const stateActivities = [];
	let totalState = 0;

	// Find valid state activities
	for (const activity of flight.plan) {

		if (activity.state === undefined) {
			continue;
		}

		totalState += activity.state;
		stateActivities.push(activity);
	}

	if (!totalState) {
		return;
	}

	// Process state activities
	for (const activity of stateActivities) {

		if (!activity.makeVirtualPoints) {
			continue;
		}

		const virtualPoints = activity.makeVirtualPoints();

		if (virtualPoints <= 0) {
			continue;
		}

		const stateFrom = flight.state;
		const stateTo = stateFrom + activity.state / (totalState / (1 - stateFrom));
		const stateStep = (stateTo - stateFrom) / (virtualPoints + 1);

		// Create flight virtual points
		for (let i = 1; i <= virtualPoints; i++) {

			const oldTime = flight.time;

			flight.state = stateFrom + (stateStep * i);

			// Clone virtual flight
			cloneVirtualFlight.call(this, flight);

			// Fast-forward plan actions based on new state
			makeFlightState.call(this, flight);

			// Update flight time
			makeFlightTime.call(this, flight);

			const elapsedTime = oldTime - flight.time;

			console.log(elapsedTime);
		}
	}
};

// Clone flight for the virtual point
function cloneVirtualFlight(flight) {

	// Clone each flight plane item
	for (const element of flight.elements) {
		for (const plane of element) {

			const oldItem = plane.item;
			const newItem = this.createItem(oldItem.type, oldItem.parent);

			// Copy over old properties/data
			for (const prop in oldItem) {

				if (prop === "Index") {
					continue;
				}

				newItem[prop] = oldItem[prop];
			}

			// Create a new entity
			// TODO: Investigate if we can re-use the same entity?
			newItem.createEntity(true);

			plane.item = newItem;
		}
	}
}

module.exports.VIRTUAL_ZONE_INNER = VIRTUAL_ZONE_INNER;
module.exports.VIRTUAL_ZONE_OUTER = VIRTUAL_ZONE_OUTER;