/** @copyright Simas Toleikis, 2015 */
"use strict";

var util = require("util");
var moment = require("moment");

// Generate mission date
module.exports = function(mission, data) {

	var params = mission.params;
	var options = mission.items.Options;
	var battle = mission.battle;
	var battleFrom = moment(battle.from).startOf("day");
	var battleTo = moment(battle.to).endOf("day");
	var date = params.date;

	// Validate desired date (from params)
	if (date && (date.isBefore(battleFrom) || date.isAfter(battleTo))) {

		var dateStr = date.format("YYYY-MM-DD");
		var battleName = battle.name;

		throw util.format('Invalid mission date value "%s" for battle "%s".', dateStr, battleName);
	}
	// Generate a random date
	else if (!date) {
		date = moment(battleFrom).add(mission.rand.real(0, 1) * battleTo.diff(battleFrom), "milliseconds");
	}

	mission.battleFrom = battleFrom;
	mission.battleTo = battleTo;
	mission.date = date;

	// Set mission options date
	options.Date = new String(date.format("D.M.YYYY"));
};