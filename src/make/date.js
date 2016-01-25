/** @copyright Simas Toleikis, 2015 */
"use strict";

const moment = require("moment");
const log = require("../log");

// Generate mission date
module.exports = function makeDate() {

	const params = this.params;
	const options = this.items.Options;
	const battle = this.battle;
	const battleFrom = moment(battle.from).startOf("day");
	const battleTo = moment(battle.to).endOf("day");
	let date = params.date;

	// Parse date as moment object
	if (date) {
		date = moment(date, "YYYY-MM-DD", true);
	}
	
	// Validate desired date (from params)
	if (date && (date.isBefore(battleFrom) || date.isAfter(battleTo))) {

		throw ["Invalid mission date!", {
			date: date.format("YYYY-MM-DD"),
			battle: battle.name
		}];
	}
	// Generate a random date
	else if (!date) {
		date = moment(battleFrom).add(this.rand.real(0, 1) * battleTo.diff(battleFrom), "milliseconds");
	}

	this.battleFrom = battleFrom;
	this.battleTo = battleTo;
	this.date = date;

	// Set mission options date
	options.Date = new String(date.format("D.M.YYYY"));

	// Log mission date
	log.I("Date:", date.format("YYYY-MM-DD"));
};