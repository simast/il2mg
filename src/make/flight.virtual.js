/** @copyright Simas Toleikis, 2017 */
"use strict";

const {makeActivityState} = require("./flight.state");
const makeFlightTime = require("./flight.time");
const makeFlightPose = require("./flight.pose");
const makeFlightActions = require("./flight.actions");
const {PRECISION_POSITION} = require("../item");

// Virtual activity zone size as inner and outer circle radius (km)
// NOTE: Two activity zones/circles are used to make sure virtual flights do
// not activate while on top of another flight position. They will only activate
// when other flights are farther than the inner zone and inside the outer zone.
// NOTE: Current max in-game draw distance for aircraft is 10 km!
const ZONE_RADIUS_INNER = 10000;
const ZONE_RADIUS_OUTER = 20000;

// Make virtual flight
module.exports = function makeFlightVirtual(flight) {

	if (!flight.virtual || flight.time <= 0) {
		return;
	}

	console.dir(flight.time, {colors: true, depth: null});

	const {plan} = flight;
	let waitTime = 0;
	let pointIndex = 0;

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
			// Make final virtual flight activity zone
			makeVirtualFlightZone.call(this, flight, pointIndex, elapsedTime);

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

			pointIndex++;

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

	// Make final virtual flight activity zone
	makeVirtualFlightZone.call(this, flight, pointIndex, waitTime);
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
function makeVirtualFlightZone(flight, pointIndex, waitTime) {

	console.log(pointIndex, waitTime);

	const isFirstPoint = (pointIndex === 0);
	const flightGroup = flight.group;
	const flightDelay = flight.plan.start.delay;

	const zoneGroup = flightGroup.createItem("Group");
	const checkZone = zoneGroup.createItem("MCU_CheckZone");
	const onActivate = zoneGroup.createItem("MCU_Activate");

	checkZone.Zone = Number(ZONE_RADIUS_INNER.toFixed(PRECISION_POSITION));
	checkZone.PlaneCoalitions = this.coalitions;
	checkZone.setPositionNear(flight.leader.item);

	onActivate.setPositionNear(checkZone);

	// Activate each element leader
	for (const element of flight.elements) {
		onActivate.addObject(element[0].item);
	}

	let onCheck = checkZone;

	// Use advanced activation trigger setup with an outer check zone to ensure
	// virtual flights do not activate on top of other flights.
	if (flightDelay || !isFirstPoint) {

		const checkZoneOuter = zoneGroup.createItem("MCU_CheckZone");
		const checkZoneOuterCheck = zoneGroup.createItem("MCU_Timer");
		const checkZoneOuterActivate = zoneGroup.createItem("MCU_Activate");
		const checkZoneOuterDeactivate = zoneGroup.createItem("MCU_Deactivate");
		const checkZoneActivate = zoneGroup.createItem("MCU_Activate");
		const checkZoneDeactivate = zoneGroup.createItem("MCU_Deactivate");
		const activateTimer = zoneGroup.createItem("MCU_Timer");
		const activateTimerDelay = zoneGroup.createItem("MCU_Timer");
		const activateTimerActivate = zoneGroup.createItem("MCU_Activate");
		const recheckTimer = zoneGroup.createItem("MCU_Timer");

		checkZone.addTarget(checkZoneDeactivate);
		checkZone.addTarget(activateTimerDelay);
		checkZone.addTarget(recheckTimer);

		checkZoneOuter.Zone = Number(ZONE_RADIUS_OUTER.toFixed(PRECISION_POSITION));
		checkZoneOuter.PlaneCoalitions = this.coalitions;
		checkZoneOuter.setPositionNear(checkZone);
		checkZoneOuter.addTarget(checkZoneOuterDeactivate);
		checkZoneOuter.addTarget(checkZone);
		checkZoneOuter.addTarget(checkZoneActivate);
		checkZoneOuter.addTarget(activateTimerDelay);
		checkZoneOuter.addTarget(activateTimerActivate);

		checkZoneOuterCheck.addTarget(checkZoneOuter);
		checkZoneOuterCheck.addTarget(checkZoneOuterActivate);
		checkZoneOuterCheck.setPositionNear(checkZoneOuter);

		checkZoneOuterActivate.addTarget(checkZoneOuter);
		checkZoneOuterActivate.setPositionNear(checkZoneOuter);

		checkZoneOuterDeactivate.addTarget(checkZoneOuter);
		checkZoneOuterDeactivate.setPositionNear(checkZoneOuter);

		checkZoneActivate.addTarget(checkZone);
		checkZoneActivate.setPositionNear(checkZone);

		checkZoneDeactivate.addTarget(checkZone);
		checkZoneDeactivate.addTarget(activateTimer);
		checkZoneDeactivate.setPositionNear(checkZone);

		activateTimerDelay.addTarget(activateTimer);
		activateTimerDelay.setPositionNear(checkZoneOuter);

		// Delay timer used to postpone activation for 2 seconds - inner check zone
		// will cancel this timer if there are planes present on the inner zone.
		activateTimerDelay.Time = 2;

		activateTimerActivate.addTarget(activateTimer);
		activateTimerActivate.setPositionNear(checkZoneOuter);

		activateTimer.addTarget(checkZoneDeactivate);
		activateTimer.addTarget(onActivate);
		activateTimer.setPositionNear(activateTimerDelay);

		onActivate.setPositionNear(activateTimer);

		recheckTimer.addTarget(checkZoneOuterCheck);
		recheckTimer.setPositionNear(checkZone);

		// When planes are detected inside the restricted inner zone - this trigger
		// will reset and will re-check again in 5 seconds.
		recheckTimer.Time = 5;

		onCheck = checkZoneOuterCheck;
	}
	else {
		checkZone.addTarget(onActivate);
	}

	// FIXME:
	flight.onStart.addTarget(onCheck);
}