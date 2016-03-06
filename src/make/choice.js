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
	
	// Validate desired plane param
	if (params.plane) {
		
		const plane = getDataID(params.plane);
		
		// Unknown plane
		if (!data.planes[plane]) {
			throw ["Unknown plane!", {plane: params.plane}];
		}
		
		// NOTE: Allow filtering on plane groups!
		filter.plane = plane + ".*?";
	}
	
	// Validate desired airfield param
	if (params.airfield) {
		
		const airfield = getDataID(params.airfield, true);
		
		// Unknown airfield ID/name
		if (!index.airfields[airfield]) {
			throw ["Unknown airfield!", {airfield: params.airfield}];
		}

		filter.airfield = airfield;
	}
	
	let isGroundStartOnly = true;
	
	// Set default player flight state
	if (params.state === undefined) {
		params.state = data.flightState.START;
	}
	else {
		isGroundStartOnly = (typeof params.state !== "number");
	}
	
	const choices = this.choices = Object.create(null);
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
			
			// Mark valid matching unit choices
			const recordData = record.split("~");
			const unitID = recordData[1];
			let choice = choices[unitID];
			
			if (!choice) {
				
				choice = choices[unitID] = {
					planes: new Set(),
					airfields: new Set(),
					tasks: new Set()
				};
			}
			
			choice.planes.add(recordData[2]);
			choice.airfields.add(recordData[3]);
			choice.tasks.add(recordData[4]);
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
		
		const errorParams = Object.create(null);
		
		if (params.date !== undefined) {
			filter.date = params.date;
		}
		
		// Log original params with error message
		for (const type in filter) {
			errorParams[type] = params[type];
		}
		
		throw ["No valid missions found!", errorParams];
	}
	
	// Pick a random valid battle date
	params.date = rand.pick(validDates);
};

// Get a normalized data ID from an input/query string
function getDataID(input, useWS) {
	
	// Replace multiple spaces with a single space character
	input = input.trim().replace(/\s{2,}/g, " ");
	
	// Remove invalid characters
	input = input.replace(/([^a-z0-9_\s]+)/gi, "");
	
	// Replace whitespace
	input = input.replace(/\s/g, useWS ? "_" : "");
	
	// All data IDs are lowercase
	return input.toLowerCase();
}