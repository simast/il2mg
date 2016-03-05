/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Generate mission player choice data
module.exports = function makeChoice() {
	
	const rand = this.rand;
	const params = this.params;
	const index = this.index;
	
	// Index scan filter data
	const filter = Object.create(null);
	
	// Validate desired coalition param
	if (params.coalition) {
		
		const countries = [];
		
		// Find all active coalition countries in the battle index
		for (const countryID in index.countries) {
			
			if (data.countries[countryID].coalition === params.coalition) {
				countries.push(countryID);
			}
		}

		// Inactive coalition
		if (!countries.length) {
			throw ["Coalition is not active!", {coalition: params.coalition}];
		}
		
		filter.country = countries;
	}
	
	// Validate desired country param
	if (params.country) {

		// Make sure country is part of requested coalition
		if (params.coalition &&
			data.countries[params.country].coalition !== params.coalition) {

			throw ["Country is not part of coalition!", {
				country: params.country,
				coalition: params.coalition
			}];
		}
		
		// Inactive country
		if (!index.countries[params.country]) {
			throw ["Country is not active!", {country: params.country}];
		}
		
		filter.country = params.country;
	}
	
	// Validate desired task param
	if (params.task) {

		// Unknown task
		if (!index.tasks[params.task]) {
			throw ["Unknown task!", {task: params.task}];
		}

		filter.task = params.task;
	}
	
	// Validate desired airfield param
	if (params.airfield) {
		
		// Unknown airfield ID/name
		if (!index.airfields[params.airfield]) {
			throw ["Unknown airfield!", {airfield: params.airfield}];
		}

		filter.airfield = params.airfield;
	}
	
	let isGroundStartOnly = true;
	
	// Set default player flight state
	if (params.state === undefined) {
		params.state = data.flightState.START;
	}
	else {
		isGroundStartOnly = (typeof params.state !== "number");
	}
	
	const validChoices = this.validChoices = new Set();
	const validRecords = Object.create(null);
	
	// Build regular expression object used to scan battle index records
	let scanRegExp = [];
	
	["country", "unit", "plane", "airfield", "task"].forEach((type) => {
		
		let filterData = filter[type];
		
		// No specific filter on this data type
		if (filterData === undefined) {
			scanRegExp.push(".+?");
		}
		else {
			
			if (!Array.isArray(filterData)) {
				filterData = [filterData];
			}
			
			// Filter on multiple data types (as OR condition)
			if (filterData.length > 1) {
				scanRegExp.push("(" + filterData.join("|") + ")");
			}
			// Filter on a single data type
			else {
				scanRegExp.push(filterData[0]);
			}
		}
	});
	
	scanRegExp = new RegExp("^" + scanRegExp.join("~") + "$");
	
	// Scan for valid battle index records
	for (const record in index.records) {
		
		const recordID = index.records[record];
		
		// Fast path to filter out records with air start only
		if (isGroundStartOnly && recordID < 0) {
			continue;
		}
		
		// Match valid records
		if (scanRegExp.test(record)) {
			
			validRecords[recordID] = true;
			
			// Mark valid matching unit and airfield choice
			const recordData = record.split("~");
			validChoices.add(recordData[1] + "~" + recordData[3]);
		}
	}
	
	// Build a list of valid battle dates
	let validDates = [];
	
	// Start with all valid battle dates
	if (!params.date) {
		validDates = Object.keys(index.dates);
	}
	// Start with season dates
	else if (index.seasons[params.date]) {
		validDates = index.seasons[params.date].slice();
	}
	// Start with single date
	else if (index.dates[params.date]) {
		validDates = [params.date];
	}
	
	// Filter initial dates based on player choices
	validDates = validDates.filter((date) => {
		
		for (const recordID of index.dates[date]) {
			
			if (validRecords[recordID]) {
				return true;
			}
		}
		
		return false;
	});
	
	if (!validDates.length) {
		
		const error = ["No valid missions found!"];
		
		if (params.date !== undefined) {
			error.push({date: params.date});
		}
		
		throw error;
	}
	
	// Pick a random valid battle date
	params.date = rand.pick(validDates);	
};