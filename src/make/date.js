/** @copyright Simas Toleikis, 2015 */
"use strict";

const moment = require("moment");
const log = require("../log");

// Generate mission date
module.exports = function makeDate() {

	const rand = this.rand;
	const params = this.params;
	const options = this.items.Options;
	const battle = this.battle;
	const battleFrom = moment(battle.from).startOf("day");
	const battleTo = moment(battle.to).endOf("day");
	let date = params.date;

	// Set date from params
	if (date) {
		
		// Parse date as moment object
		date = moment(date, "YYYY-MM-DD", true);
		
		// Set random date from special season value
		if (!date.isValid()) {
			
			// Find matching map season
			for (const season in battle.map.season) {
				
				// Found matching season map
				if (season === params.date) {
					
					const seasonData = battle.map.season[season];
					const seasonFrom = moment(seasonData.from);
					const seasonTo = moment(seasonData.to);
					
					// Pick random date from season period
					date = seasonFrom.add(rand.real(0, 1) * seasonTo.diff(seasonFrom), "ms");
					
					break;
				}
			}
		}
	}
	
	// Validate desired date (from params)
	if (date && !date.isBetween(battleFrom, battleTo)) {

		throw ["Invalid mission date!", {
			date: date.isValid() ? date.format("YYYY-MM-DD") : params.date,
			battle: battle.name
		}];
	}
	// Generate a random date
	else if (!date) {
		date = moment(battleFrom).add(rand.real(0, 1) * battleTo.diff(battleFrom), "ms");
	}

	this.battleFrom = battleFrom;
	this.battleTo = battleTo;
	this.date = date;

	// Set mission options date
	options.Date = new String(date.format("D.M.YYYY"));

	// Log mission date
	log.I("Date:", date.format("YYYY-MM-DD"));
};