/** @copyright Simas Toleikis, 2015 */
"use strict";

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

		throw ["Invalid mission date!", {
			date: date.format("YYYY-MM-DD"),
			battle: battle.name
		}];
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

	// Log mission date
	log.info("Date:", date.format("YYYY-MM-DD"));
};