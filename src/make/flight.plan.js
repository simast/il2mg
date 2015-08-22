/** @copyright Simas Toleikis, 2015 */
"use strict";

// Data constants
var planAction = DATA.planAction;

// Plan action make parts
var makePlanAction = Object.create(null);

makePlanAction[planAction.START] = require("./plan.start.js");
makePlanAction[planAction.TAKEOFF] = require("./plan.takeoff.js");
makePlanAction[planAction.WAIT] = require("./plan.wait.js");
makePlanAction[planAction.LAND] = require("./plan.land.js");

// Make mission flight plan
module.exports = function makeFlightPlan(flight) {
	
	var rand = this.rand;
	var plan = flight.plan = [];

	// Initial start plan action
	plan.push({type: planAction.START});

	// Take off plan action
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
	
	// TODO: Fast-forward plan to required flight state

	// List of output callback functions for previous plan action (for each element)
	var outputPrev = [];

	// Process pending plan actions
	for (var action of plan) {

		if (!makePlanAction[action.type]) {
			continue;
		}

		var output = [];

		// Multiple flight elements will share a single plan, but can use a different
		// command set (as with second element on guard duty for first leading element).
		flight.elements.forEach(function(element, elementIndex) {

			var input = outputPrev[elementIndex];

			if (typeof input !== "function") {
				input = function() {};
			}

			output.push(makePlanAction[action.type].call(
				this,
				action,
				element,
				flight,
				input
			));

		}, this);

		outputPrev = output;
	}
};