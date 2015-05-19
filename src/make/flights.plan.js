/** @copyright Simas Toleikis, 2015 */
"use strict";

// Plan commands
var planCommand = {
	TAKEOFF: "takeoff",
	LAND: "land",
	WAIT: "wait"
};

// Make mission flight plan
module.exports = function makeFlightPlan(flight) {
	
	var rand = this.rand;
	var plan = flight.plan = [];
	
	// Take off command
	if (typeof flight.state !== "number") {
		plan.push({do: planCommand.TAKEOFF});
	}
	
	// Random wait command
	plan.push({
		do: planCommand.WAIT,
		time: rand.integer(60, 180)
	});
	
	// Land command
	plan.push({do: planCommand.LAND});
	
	// TODO: Fast-forward plan to required flight state
	// TODO: Process pending plan commands
};