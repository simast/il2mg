/** @copyright Simas Toleikis, 2016 */
"use strict";

const makeFlightFuel = require("./flight.fuel");

// Plan activity used to do nothing and wait for a specified amount of time
module.exports = class ActivityWait {

	// Make wait activity action
	makeAction(element, input) {

		const {flight} = this;

		if (!input) {
			return;
		}

		const leaderElement = flight.elements[0];

		// Process wait action only for leading element
		if (element !== leaderElement) {
			return;
		}

		const leaderPlaneItem = element[0].item;

		// Wait using timer command
		const waitTimer = flight.group.createItem("MCU_Timer");

		waitTimer.Time = +(this.time.toFixed(3));
		waitTimer.setPositionNear(leaderPlaneItem);

		// Connect timer command to previous action
		input(waitTimer);

		// Connect timer command to next action
		return (input) => {
			waitTimer.addTarget(input);
		};
	}

	// Make wait activity state
	makeState(state) {

		const {mission, flight} = this;
		const {plan} = flight;

		// Fast-forward wait activity state based on elapsed time
		const elapsedTime = this.time * state;
		const planeSpeed = mission.planes[flight.leader.plane].speed;
		const waitDistance = elapsedTime * (planeSpeed * 1000 / 3600);

		this.time -= elapsedTime;

		// Use flight fuel for fast-forward wait distance
		makeFlightFuel.call(mission, flight, waitDistance);

		// Remove activity from plan
		if (state >= 1) {
			plan.splice(plan.indexOf(this), 1);
		}
	}
};