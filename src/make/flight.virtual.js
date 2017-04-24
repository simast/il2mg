/** @copyright Simas Toleikis, 2017 */
"use strict";

const {makeActivityState} = require("./flight.state");
const makeFlightTime = require("./flight.time");
const makeFlightPose = require("./flight.pose");
const makeFlightActions = require("./flight.actions");

// Virtual activity zone size as inner and outer circle radius (km)
// NOTE: Two activity zones/circles are used to make sure virtual flights do
// not activate while on top of another flight position. They will only activate
// when the flight is farther than the inner zone and inside the outer zone.
// NOTE: Current max in-game draw distance for aircraft is 10 km!
const VIRTUAL_ZONE_RADIUS_INNER = 10000;
const VIRTUAL_ZONE_RADIUS_OUTER = 20000;

// Make virtual flight
module.exports = function makeFlightVirtual(flight) {

	if (!flight.virtual || flight.time <= 0) {
		return;
	}

	console.dir(flight.time, {colors: true, depth: null});

	const {plan} = flight;
	let waitTime = 0;

	// Process plan activities
	for (const activity of plan) {

		const activityTime = activity.time;

		// Skip non-state activities
		if (activityTime === undefined) {
			continue;
		}

		let virtualPoints = 0;

		if (activity.makeVirtualPoints) {
			virtualPoints = activity.makeVirtualPoints();
		}

		// Skip activities without virtual points
		if (!virtualPoints) {

			waitTime += activityTime;
			makeActivityState.call(this, activity, activityTime);

			continue;
		}

		const stepTime = activityTime / (virtualPoints + 1);
		let isActivityRemoved = false;

		// Create virtual points
		for (let i = 1; i <= virtualPoints; i++) {

			const oldTime = flight.time;

			// Fast-forward virtual flight activity state
			makeActivityState.call(this, activity, stepTime);

			// Make virtual flight time
			makeFlightTime.call(this, flight);

			const elapsedTime = waitTime + (oldTime - flight.time);

			// Make virtual flight activity zone
			makeVirtualFlightZone.call(this, flight, elapsedTime);

			// Reset accumulated wait time
			if (waitTime) {
				waitTime = 0;
			}

			// Make virtual flight plane items
			makeVirtualFlightPlanes.call(this, flight);

			// Make virtual flight air start pose
			makeFlightPose.call(this, flight);

			// Make virtual flight plan actions
			makeFlightActions.call(this, flight);

			// NOTE: Activities may remove themselves from the plan while
			// fast-forwarding their state!
			isActivityRemoved = (plan.indexOf(activity) === -1);

			if (isActivityRemoved) {
				break;
			}
		}

		const remainingTime = activity.time;

		// Finish activity by advancing the remaining time
		if (remainingTime) {

			waitTime += remainingTime;

			if (!isActivityRemoved) {
				makeActivityState.call(this, activity, remainingTime);
			}
		}
	}

	// Make virtual flight activity zone
	makeVirtualFlightZone.call(this, flight, waitTime);
};

// Make virtual flight plane items
function makeVirtualFlightPlanes(flight) {

	// Clone each flight plane item
	for (const element of flight.elements) {
		for (const plane of element) {

			const oldItem = plane.item;
			const newItem = this.createItem(oldItem.type, oldItem.parent);

			// Copy over old properties/data
			for (const prop in oldItem) {

				// Keep unique item index
				if (prop === "Index") {
					continue;
				}

				newItem[prop] = oldItem[prop];
			}

			// Create a new entity
			newItem.createEntity(true);

			plane.item = newItem;
		}
	}
}

// Make virtual flight activity zone
function makeVirtualFlightZone(flight, waitTime) {

	console.log(waitTime);
}

module.exports.VIRTUAL_ZONE_RADIUS_INNER = VIRTUAL_ZONE_RADIUS_INNER;
module.exports.VIRTUAL_ZONE_RADIUS_OUTER = VIRTUAL_ZONE_RADIUS_OUTER;