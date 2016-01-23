/** @copyright Simas Toleikis, 2016 */
"use strict";

const makeTaskTest = require("./task.test");

// Make mission practice flight task
module.exports = function makeTaskPractice() {
	
	// NOTE: Practice flight is using the same logic as test flight
	return makeTaskTest.apply(this, arguments);
};