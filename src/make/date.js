/** @copyright Simas Toleikis, 2014 */
"use strict";

var util = require("util");
var moment = require("moment");

// Generate mission date
module.exports = function(mission) {

	var params = mission.params;
	var options = mission.blocks.Options;
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
		date = battleFrom.add(mission.rand.real(0, 1) * battleTo.add(1, "d").diff(battleFrom), "milliseconds");
	}

	mission.date = date;

	// Set mission options date
	options.Date = new String(date.format("D.M.YYYY"));
};