/** @copyright Simas Toleikis, 2015 */
"use strict";

const requireDir = require("require-directory");

// Data constants
const planAction = DATA.planAction;

// Plan action and task make parts
const makeParts = requireDir(module, {include: /(plan|task)\..+\.js$/});

// Make mission flight plan
module.exports = function makeFlightPlan(flight) {
	
	const plan = flight.plan = [];

	// Initial start plan action
	plan.push({type: planAction.START});

	// Take off plan action
	if (typeof flight.state !== "number") {
		plan.push({type: planAction.TAKEOFF});
	}
	
	// Form up plan action
	plan.push({type: planAction.FORM});

	let taskID = flight.task;
	
	// Make task specific plan
	do {
		
		const makeTask = makeParts["task." + taskID];
		
		if (makeTask) {
			
			makeTask.call(this, flight);
			break;
		}
		
		taskID = this.tasks[taskID].parent;
	}
	while (taskID);

	// Land plan action
	plan.land = plan[plan.push({type: planAction.LAND}) - 1];
	
	// TODO: Fast-forward plan to required flight state

	// List of output callback functions for previous plan action (for each element)
	let outputPrev = [];

	// Process pending plan actions
	for (const action of plan) {
		
		let makePlanAction;
		
		// Use default/common plan make action
		if (action.type) {
			makePlanAction = makeParts["plan." + action.type];
		}
		
		// Use custom plan make action
		if (typeof action.makeAction === "function") {
			makePlanAction = action.makeAction;
		}
		// Boolean flag used to skip making plan actions
		else if (action.makeAction === false) {
			makePlanAction = null;
		}
	
		if (!makePlanAction) {
			continue;
		}

		const output = [];

		// Multiple flight elements will share a single plan, but can use a different
		// command set (as with second element on guard duty for first leading element).
		flight.elements.forEach((element, elementIndex) => {

			let input = outputPrev[elementIndex];

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
		});

		outputPrev = output;
	}
};