/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
var planAction = DATA.planAction;

// Plan action make parts
var makePlanAction = Object.create(null);

makePlanAction[planAction.TAKEOFF] = require("./plan.takeoff.js");
makePlanAction[planAction.WAIT] = require("./plan.wait.js");
makePlanAction[planAction.LAND] = require("./plan.land.js");

// Make mission flight plan
module.exports = function makeFlightPlan(flight) {
	
	var rand = this.rand;
	var plan = flight.plan = [];

	// Add initial take off plan action
	if (typeof flight.state !== "number") {
		plan.push({type: planAction.TAKEOFF});
	}

	// TODO: Make mission related plan

	// FIXME: Random wait action
	plan.push({
		type: planAction.WAIT,
		time: rand.integer(60, 90)
	});

	// FIXME: Land action
	plan.push({type: planAction.LAND});
	
	// TODO: Add support for shedulled flights
	var onStart = flight.onStart = flight.group.createItem("MCU_TR_MissionBegin");
	
	onStart.setPositionNear(flight.leader.item);
	
	// TODO: Fast-forward plan to required flight state

	// Connect initial plan input with onStart event command
	var output = function(input) {
		onStart.addTarget(input);
	};
	
	// Process pending plan actions
	for (var action of plan) {

		if (makePlanAction[action.type]) {

			output = makePlanAction[action.type].call(this, flight, action, output);

			if (typeof output !== "function") {
				output = function() {};
			}
		}
	}
};