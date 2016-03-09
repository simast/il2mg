/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// List of unit data params used as combined record key
const RECORD_PARAMS = [
	"country",
	"unit",
	"plane",
	"airfield",
	"task"
];

// Separator used for building unique record keys
const RECORD_SEP = "~";

// Generate mission player choice data
module.exports = function makeChoice() {
	
	const rand = this.rand;
	const params = this.params;
	const index = this.index;
	
	// Index scan filter data
	const filter = Object.create(null);
	
	// Filter on desired coalition param
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
		
		filter.coalition = params.coalition;
		filter.country = countries;
	}
	
	// Filter on desired country param
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
	
	// Filter on desired task param
	if (params.task) {

		// Unknown task
		if (!index.tasks[params.task]) {
			throw ["Unknown task!", {task: params.task}];
		}

		filter.task = params.task;
	}
	
	// Filter on desired plane param
	if (params.plane) {
		
		let query = getDataID(params.plane);
		let isPlaneKnown = Boolean(data.planes[query]);
		
		// Try to find matching plane ID when query is given as a plane name
		if (!isPlaneKnown) {
			
			for (const planeID in data.planes) {
				
				const plane = data.planes[planeID];
			
				if (plane && typeof plane === "object" && plane.name &&
					query === getDataID(plane.name)) {
					
					query = planeID;
					isPlaneKnown = true;
					break;
				}
			}
		}
		
		// Unknown plane ID
		if (!isPlaneKnown) {
			throw ["Unknown plane!", {plane: params.plane}];
		}
		// Exact matching plane ID provided
		else if (index.planes[query]) {
			filter.plane = query;
		}
		// Filter as a partial plane ID query (to match groups)
		else {
			filter.plane = query + ".*?";
		}
	}
	
	// Filter on desired unit param
	if (params.unit) {
		
		const query = getDataID(params.unit);
		
		// Exact matching unit ID provided
		if (index.units[query]) {
			filter.unit = query;
		}
		// Filter as a partial unit ID query
		else {
			filter.unit = ".*?" + query + ".*?";
		}
	}
	
	// Filter on desired airfield param
	if (params.airfield) {
		
		const query = getDataID(params.airfield, true);
		
		// Unknown airfield ID/name
		if (!index.airfields[query]) {
			throw ["Unknown airfield!", {airfield: params.airfield}];
		}

		filter.airfield = query;
	}
	
	let isGroundStartOnly = true;
	
	// Set default player flight state
	if (params.state === undefined) {
		params.state = data.flightState.START;
	}
	else {
		isGroundStartOnly = (typeof params.state !== "number");
	}
	
	const choice = this.choice = {
		airfield: new Set() // Always track airfield choice (for air/ground start)
	};
	
	const validRecords = Object.create(null);
	let scanRegExp = (Object.keys(filter).length > 0);
	
	if (scanRegExp) {
	
		// Build regular expression object used to scan battle index records
		scanRegExp = [];
		
		RECORD_PARAMS.forEach((param) => {
			
			let filterData = filter[param];
			
			// No specific filter on this data param
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
				// Filter on a single data param
				else {
					scanRegExp.push(filterData[0]);
				}
				
				choice[param] = new Set();
			}
		});
		
		scanRegExp = new RegExp("^" + scanRegExp.join(RECORD_SEP) + "$");
	}
	
	// Scan for valid battle index records
	for (const record in index.records) {
		
		const recordID = index.records[record];
		
		// Fast path to filter out records with air start only
		if (isGroundStartOnly && recordID < 0) {
			continue;
		}
		
		// Match valid records
		if (!scanRegExp || scanRegExp.test(record)) {
			
			validRecords[recordID] = true;
			
			const recordData = record.split(RECORD_SEP);
			
			// Mark valid matching player choices
			RECORD_PARAMS.forEach((param, paramIndex) => {
				
				if (choice[param]) {
					
					let paramData = recordData[paramIndex];
					
					// Country choice is a number
					if (param === "country") {
						paramData = Number(paramData);
					}
					
					choice[param].add(paramData);
				}
			});
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
			
			if (params[type] !== undefined) {
				errorParams[type] = params[type];
			}
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