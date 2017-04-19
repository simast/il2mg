/** @copyright Simas Toleikis, 2017 */
"use strict";

const {makeActivityState} = require("./flight.state");
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

	if (!flight.virtual || flight.time <= 0) {
		return;
	}

	let delayTime = 0;

	// Process state activities
	for (const activity of flight.plan) {

		const activityTime = activity.time;

		if (activityTime === undefined) {
			continue;
		}

		if (!activity.makeVirtualPoints) {

			delayTime += activityTime;
			continue;
		}

		const virtualPoints = activity.makeVirtualPoints();

		if (virtualPoints <= 0) {

			delayTime += activityTime;
			continue;
		}

		const stepTime = activityTime / (virtualPoints + 1);

		// Create flight virtual points
		for (let i = 1; i <= virtualPoints; i++) {

			const oldTime = flight.time;

			// Fast-forward activity state
			makeActivityState.call(this, activity, stepTime);

			// Clone virtual flight
			cloneVirtualFlight.call(this, flight);

			// Update flight time
			makeFlightTime.call(this, flight);

			const elapsedTime = delayTime + (oldTime - flight.time);

			if (delayTime) {
				delayTime = 0;
			}

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