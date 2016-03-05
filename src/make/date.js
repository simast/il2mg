/** @copyright Simas Toleikis, 2015 */
"use strict";

const moment = require("moment");
const log = require("../log");

// Generate mission date
module.exports = function makeDate() {
	
	const params = this.params;
	const index = this.index;
	const options = this.items.Options;
	const battle = this.battle;
	
	this.battleFrom = moment(battle.from).startOf("day");
	this.battleTo = moment(battle.to).endOf("day");
	
	// Parse date as moment object
	const date = this.date = moment(params.date, "YYYY-MM-DD", true);

	// Set mission options date
	options.Date = new String(date.format("D.M.YYYY"));

	// Log mission date
	log.I("Date:", date.format("YYYY-MM-DD"));
};