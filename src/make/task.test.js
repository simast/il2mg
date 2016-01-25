/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");

// Data constants
const planAction = data.planAction;

// Make mission test flight task
module.exports = function makeTaskTest(flight) {
	
	const rand = this.rand;
	const plan = flight.plan;
	const isPlayerFlightLeader = (flight.player === flight.leader);
	
	// Skip wait and land plan actions where player is leader of the flight
	if (isPlayerFlightLeader) {
		
		flight.plan.push({
			makeAction: (action, element, flight, input) => {
				plan.land.makeAction = false;
			}
		});
		
		return;
	}
	
	// Use wait (followed by land) action for other flights
	plan.push({
		type: planAction.WAIT,
		time: rand.integer(15 * 60, 30 * 60) // 15-30 minutes
	});
};