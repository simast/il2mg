/** @copyright Simas Toleikis, 2015 */
"use strict"

const moment = require("moment")
const log = require("../log")

// Generate mission date
module.exports = function makeDate() {

	const params = this.params
	const index = this.index
	const options = this.items.Options

	// Parse date as moment object
	const date = this.date = moment(params.date)

	// Find matching season based on mission date
	for (const season in index.seasons) {

		if (index.seasons[season].indexOf(params.date) >= 0) {

			this.season = season
			break
		}
	}

	// Set mission options date
	options.Date = new String(date.format("D.M.YYYY"))

	// Log mission date and season
	log.I("Date:", params.date, this.season)
}