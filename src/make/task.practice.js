/** @copyright Simas Toleikis, 2015 */
"use strict";

var util = require("util");

// Data constants
var planAction = DATA.planAction;

// Make mission practice task
module.exports = function makeTaskPractice(flight) {
	
	var rand = this.rand;
	var plan = flight.plan;
	
	// FIXME: Random wait action
	plan.push({
		type: planAction.WAIT,
		time: rand.integer(60, 90)
	});
};