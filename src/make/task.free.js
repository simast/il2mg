/** @copyright Simas Toleikis, 2016 */
"use strict";

const {activityType} = require("../data");
const {makeActivity} = require("./flight.plan");

// Make mission free flight task
module.exports = function makeTaskFree(flight) {

	const {rand} = this;

	flight.plan.push(makeActivity.call(this, flight, {
		type: activityType.WAIT,
		time: Math.round(rand.real(15, 30) * 60) // 15-30 minutes
	}));
};