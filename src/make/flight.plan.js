/** @copyright Simas Toleikis, 2015 */
"use strict";

const requireDir = require("require-directory");
const {planAction} = require("../data");

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
	
	// Make task specific plan
	const makeTask = makeParts["task." + flight.task.id];
	
	if (makeTask) {
		makeTask.call(this, flight);
	}

	// Land plan action
	if (plan.land === undefined) {
		plan.land = plan[plan.push({type: planAction.LAND}) - 1];
	}
	
	// TODO: Fast-forward plan to required flight state

	// List of output callback functions from previous plan action (for each
	// element, used as input for the next plan action).
	let outputPrev = [];

	// Process pending plan actions
	for (const action of plan) {
		
		let makePlanAction;
		
		// Use custom plan make action
		if (typeof action.makeAction === "function") {
			makePlanAction = action.makeAction;
		}
		// Use default/common plan make action
		// NOTE: Boolean flag can be used to skip making plan action
		else if (action.makeAction !== false && action.type) {
			makePlanAction = makeParts["plan." + action.type];
		}
	
		if (!makePlanAction) {
			continue;
		}

		const output = [];

		// Multiple flight elements will share a single plan, but can use a different
		// command set (as with second element on cover duty for first leading element).
		flight.elements.forEach((element, elementIndex) => {
			
			output.push(makePlanAction.call(
				this,
				action,
				element,
				flight,
				outputPrev[elementIndex]
			));
		});

		outputPrev = output;
	}
};