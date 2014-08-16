/** @copyright Simas Toleikis, 2014 */
"use strict";

var util = require("util");
var moment = require("moment");

// Generate mission date and time
module.exports = function(mission) {

	var params = mission.params;
	var options = mission.entities.Options;
	var date = mission.date;
	var time = params.time;

	// Generate a random time
	// TODO: Improve random time generation (should have less night missions)
	if (!time) {
		time = moment().startOf("day").add(Math.random() * 3600 * 24, "seconds");
	}

	// Apply time to mission date object
	date.hour(time.hour());
	date.minute(time.minute());
	date.second(time.second());

	// TODO: Set mission.time to valid time ranges (dusk, morning, night etc)

	// Set mission time
	options.set("Time", date.format("H:m:s"), true);
};