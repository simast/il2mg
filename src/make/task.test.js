/** @copyright Simas Toleikis, 2016 */
"use strict";

const data = require("../data");

// Data constants
const planAction = data.planAction;

// Make mission test flight task
module.exports = function makeTaskTest(flight) {
	
	const rand = this.rand;
	
	flight.plan.push({
		type: planAction.WAIT,
		time: rand.integer(15 * 60, 30 * 60) // 15-30 minutes
	});
};