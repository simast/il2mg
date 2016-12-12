/** @copyright Simas Toleikis, 2015 */
"use strict";

// Forward declare all exports (required due to cyclic dependencies)
module.exports = makeFlightPlan;
module.exports.makeActivity = makeActivity;

const requireDir = require("require-directory");
const {activityType} = require("../data");
const activities = requireDir(module, {include: /activity\..+\.js$/});
const tasks = requireDir(module, {include: /task\..+\.js$/});
const makeFlightPath = require("./flight.path");
const makeFlightState = require("./flight.state");
const makeFlightPose = require("./flight.pose");

// Make mission flight plan
function makeFlightPlan(flight) {

	const plan = flight.plan = [];
	const task = flight.task;
	const airfield = this.airfields[flight.airfield];

	// Initial start plan activity
	plan.start = plan[plan.push(makeActivity.call(this, flight, {
		type: activityType.START,
		position: airfield.position
	})) - 1];

	// Take off plan activity
	if (typeof flight.state !== "number") {
		plan.push(makeActivity.call(this, flight, {type: activityType.TAKEOFF}));
	}

	// Form up plan activity
	plan.push(makeActivity.call(this, flight, {type: activityType.FORM}));

	// Make task specific plan
	const makeTask = tasks["task." + task.id];

	if (typeof makeTask === "function") {
		makeTask.call(this, flight);
	}

	// Land plan activity
	if (plan.land === undefined) {

		plan.land = plan[plan.push(makeActivity.call(this, flight, {
			type: activityType.LAND
		})) - 1];
	}

	// Make final flight path with adjusted offmap bounds
	makeFlightPath.call(this, flight);

	// Fast-forward plan actions based on state
	makeFlightState.call(this, flight);

	// Make initial flight air start pose
	makeFlightPose.call(this, flight, plan.start.position);

	// TODO: Build virtual route points (for AI flights only)

	// List of output callback functions from previous plan action (for each
	// element, used as input for the next plan action).
	let outputPrev = [];

	// Process pending plan actions
	for (const activity of plan) {

		if (typeof activity.makeAction !== "function") {
			continue;
		}

		const output = [];

		// NOTE: Multiple flight elements will share a single plan, but can use a
		// different command set (as with second element on cover duty for first
		// leading element for example).
		flight.elements.forEach((element, elementIndex) => {
			output.push(activity.makeAction(element, outputPrev[elementIndex]));
		});

		outputPrev = output;
	}
}

// Utility/factory function used to create flight plan activities
function makeActivity(flight, params = {}) {

	let activity = {};

	// Create a common activity type/class
	if (params.type) {

		const activityClass = activities["activity." + params.type];

		if (activityClass) {
			activity = new activityClass();
		}
	}

	// Set activity params
	Object.assign(activity, params);
	Object.defineProperty(activity, "mission", {value: this});
	Object.defineProperty(activity, "flight", {value: flight});

	return activity;
}