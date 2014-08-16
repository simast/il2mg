/** @copyright Simas Toleikis, 2014 */
"use strict";

var util = require("util");
var moment = require("moment");

// Generate mission date and time
module.exports = function(mission) {

	var params = mission.params;
	var options = mission.entities.Options;
	var battle = mission.battle;
	var battleFrom = mission.battleFrom = moment(battle.from);
	var battleTo = mission.battleTo = moment(battle.to);
	var date = params.date;

	// Validate desired date (from params)
	if (date && (date.isBefore(battleFrom) || date.isAfter(battleTo))) {

		var dateStr = date.format("YYYY-MM-DD");
		var battleName = battle.name;

		throw util.format('Invalid mission date value "%s" for battle "%s".', dateStr, battleName);
	}
	// Generate a random date
	else if (!date) {
		date = battleFrom.add(Math.random() * battleTo.diff(battleFrom), "milliseconds");
	}

	mission.date = date;

	// Set mission date
	options.set("Date", date.format("D.M.YYYY"), true);
};