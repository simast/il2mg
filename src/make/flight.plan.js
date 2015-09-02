/** @copyright Simas Toleikis, 2015 */
"use strict";

var requireDir = require("require-directory");

// Data constants
var planAction = DATA.planAction;

// Plan action and task make parts
var makeParts = requireDir(module, {include: /(plan|task)\..+\.js$/});

// Make mission flight plan
module.exports = function makeFlightPlan(flight) {
	
	var plan = flight.plan = [];

	// Initial start plan action
	plan.push({type: planAction.START});

	// Take off plan action
	if (typeof flight.state !== "number") {
		plan.push({type: planAction.TAKEOFF});
	}

	var taskID = flight.task;
	
	// Make task specific plan
	do {
		
		var makeTask = makeParts["task." + taskID];
		
		if (makeTask) {
			
			makeTask.call(this, flight);
			break;
		}
		
		taskID = this.tasks[taskID].parent;
	}
	while (taskID);

	// Land plan action
	plan.push({type: planAction.LAND});
	
	// TODO: Fast-forward plan to required flight state

	// List of output callback functions for previous plan action (for each element)
	var outputPrev = [];

	// Process pending plan actions
	for (var action of plan) {
		
		var makePlanAction = makeParts["plan." + action.type];
	
		if (!makePlanAction) {
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

			output.push(makePlanAction.call(
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