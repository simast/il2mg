/** @copyright Simas Toleikis, 2015 */
"use strict";

const fs = require("fs");
const path = require("path");
const requireDir = require("require-directory");
const moment = require("moment");

const data = module.exports = Object.create(null);

// Application name
data.name = "il2mg";

// Application version
data.version = "r8";

// Application copyright
data.copyright = "(C) Simas Toleikis, 2015-2016";

// List of supported mission localization languages
data.languages = Object.freeze([
	"eng", // English (default)
	"ger", // German
	"pol", // Polish
	"rus", // Russian
	"spa", // Spanish
	"fra" // French
]);

// Data tags for special airfield items
data.itemTag = Object.freeze({
	PLANE: -1, // Plane spot
	TRUCK_CARGO: -2, // Cargo truck
	TRUCK_FUEL: -3, // Fuel truck
	CAR: -4, // Car vehicle
	AA_MG: -5, // Anti-aircraft (MG)
	AA_FLAK: -6, // Anti-aircraft (Flak)
	AA_TRAIN: -7, // Anti-aircraft (Train platform)
	LIGHT_SEARCH: -8, // Search light
	LIGHT_LAND: -9, // Landing light
	BEACON: -10, // Beacon
	WINDSOCK: -11, // Windsock
	EFFECT: -12, // Effect
	WRECK: -13 // Wreckage
});

// Data flags for airfield items
data.itemFlag = Object.freeze({
	BLOCK_DECO: 1, // Decoration
	BLOCK_FUEL: 2, // Fuel item
	PLANE_CAMO: 1, // Camouflage plane spot
	EFFECT_SMOKE: 1, // House smoke effect
	EFFECT_CAMP: 2, // Campfire effect
	EFFECT_LAND: 3, // Landing fire effect
	EFFECT_SIREN: 4, // Siren effect
	TAXI_INV: 1, // Invertible taxi route
	TAXI_RUNWAY: 1, // Taxi runway point
	ROUTE_STOP: 1, // Route stop point
	ROUTE_ROAD: 2 // Route road formation
});

// Front line item types
data.frontLine = Object.freeze({
	BORDER: 1, // Border line
	ATTACK: 2 // Attack arrow
});

// Location item types
data.location = Object.freeze({
	VILLAGE: 1, // Small village
	TOWN: 2, // Medium town
	CITY: 3 // Large city
});

// Map season types
// NOTE: Order is important (used when defining plane skins for each season)!
data.season = Object.freeze({
	SPRING: "spring",
	SUMMER: "summer",
	AUTUMN: "autumn",
	WINTER: "winter",
	DESERT: "desert"
});

// Altitude level types
data.altitudeLevel = Object.freeze({
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high"
});

// Coalitions
data.coalition = Object.freeze({
	ALLIES: 1,
	AXIS: 2
});

// Territory types
data.territory = Object.freeze({
	FRONT: -1,
	UNKNOWN: 0
	// NOTE: Any positive territory type ID is a coalition ID
});

// Plane size constants (types/IDs)
data.planeSize = Object.freeze({
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
});

// Weather state/condition constants
data.weatherState = Object.freeze({
	PERFECT: 1,
	GOOD: 2,
	BAD: 3,
	EXTREME: 4
});

// Precipitation type constants
data.precipitation = Object.freeze({
	NONE: 0,
	RAIN: 1,
	SNOW: 2
});

// Flight states
// NOTE: Numeric (0..1) states represent aircraft in the air.
data.flightState = Object.freeze({
	START: "start", // Parking, engine not running
	TAXI: "taxi", // On the taxiway, engine running, taxiing to runway
	RUNWAY: "runway" // On the runway, engine running, ready for takeoff
});

// Common flight plan actions
data.planAction = Object.freeze({
	START: "start", // Initial start action
	TAKEOFF: "takeoff", // Taxi (optionally) and takeoff from airfield
	FORM: "form", // Form up (set formations and element cover)
	WAIT: "wait", // Wait for something (do nothing)
	FLY: "fly", // Fly to waypoint/location
	LAND: "land" // Land on airfield (ending the flight)
});

// Map colors as RGB array values
data.mapColor = Object.freeze({
	ATTACK: [156, 156, 156],
	ROUTE: [52, 52, 52],
	// NOTE: Special color values that will change in-game based on user settings
	ENEMY: [10, 0, 0],
	FRIEND: [0, 0, 10]
});

// Briefing colors as HTML hex color values
data.briefingColor = Object.freeze({
	LIGHT: "#fbfbfb",
	DARK: "#959595"
});

// Load all static data
(() => {

	// NOTE: For performance reasons JSON files in the binary/compiled mode will
	// be loaded using native JSON object.
	const useJSON5 = !process.versions.enclose;

	if (useJSON5) {

		// NOTE: Having JSON5 module name as two separate string literals will trick
		// enclose to not included it in the binary file when compiling.
		const JSON5 = require("json" + "5");

		// Add new require() loader to handle JSON5 data files
		require.extensions[".json5"] = (module, file) => {
			module.exports = JSON5.parse(fs.readFileSync(file, "utf8"));
		};
		
		// JSON5 support for require-directory
		requireDir.defaults.extensions.push("json5");
	}
	
	data.items = [];
	
	try {
		data.items = require("../data/items");
	}
	catch (e) {}

	data.vehicles = Object.freeze(require("../data/vehicles"));
	data.clouds = Object.freeze(require("../data/clouds"));
	data.time = Object.freeze(require("../data/time"));
	data.callsigns = Object.freeze(require("../data/callsigns"));
	data.countries = Object.freeze(require("../data/countries"));
	data.battles = Object.freeze(require("../data/battles"));
	data.tasks = Object.freeze(requireDir(module, "../data/tasks"));
	data.planes = Object.create(null);

	// Load countries
	for (const countryID in data.countries) {

		const country = data.countries[countryID];
		const countryPath = "../data/countries/" + countryID + "/";

		country.formations = require(countryPath + "formations");
		country.names = require(countryPath + "names");
		country.ranks = require(countryPath + "ranks");
	}

	// Load planes
	const planeData = requireDir(module, "../data/planes");
	
	for (const planeGroup in planeData) {
		for (const planeID in planeData[planeGroup]) {
			data.planes[planeID] = planeData[planeGroup][planeID];
		}
	}

	Object.freeze(data.planes);

	// Load battles
	// TODO: Load only required mission battle data
	for (const battleID in data.battles) {

		const battle = data.battles[battleID];
		const battlePath = "../data/battles/" + battleID + "/";

		battle.countries = [];
		battle.blocks = Object.freeze(require(battlePath + "blocks"));
		battle.locations = Object.freeze(require(battlePath + "locations"));
		battle.fronts = Object.freeze(require(battlePath + "fronts"));
		battle.map = Object.freeze(require(battlePath + "map"));
		battle.weather = Object.freeze(require(battlePath + "weather"));
		battle.airfields = Object.freeze(require(battlePath + "airfields"));
		battle.roles = Object.freeze(requireDir(module, battlePath + "roles/"));
		battle.units = Object.create(null);

		// Load battle unit data
		const unitsData = requireDir(module, battlePath + "units/");

		for (let unitCountryID in unitsData) {

			unitCountryID = parseInt(unitCountryID, 10);

			// Ignore invalid country IDs
			if (isNaN(unitCountryID) || !data.countries[unitCountryID]) {
				continue;
			}

			const unitsDataCountry = unitsData[unitCountryID];

			// Build units list
			for (const unitGroup in unitsDataCountry) {
				for (const unitID in unitsDataCountry[unitGroup]) {

					battle.units[unitID] = unitsDataCountry[unitGroup][unitID];
					battle.units[unitID].country = unitCountryID;
				}
			}

			// Register country as part of the battle
			battle.countries.push(unitCountryID);
		}

		Object.freeze(battle.countries);
		Object.freeze(battle.units);
	}
})();

/**
 * Register a new item (world object) type.
 *
 * @param {object} item Item data.
 * @returns {number} Item type ID.
 */
data.registerItemType = function(item) {
	
	if (typeof item !== "object" || !item.type || !item.script || !item.model) {
		throw new TypeError("Invalid item data.");
	}

	const items = this.items;

	// Lowercase and trim script/model paths
	item.script = item.script.trim().toLowerCase();
	item.model = item.model.trim().toLowerCase();
	
	// Item type ID as a string (lowercase file name without extension)
	const stringTypeID = path.win32.basename(item.script, ".txt");

	// Try to find existing item type ID by script index
	let numberTypeID = items.indexOf(stringTypeID);
	
	// Add new item type
	if (numberTypeID === -1) {
		
		numberTypeID = items.push(stringTypeID) - 1;
		
		const itemFile = "data/items/" + stringTypeID;
		
		try {
			require.resolve("../" + itemFile);
		}
		// Write item JSON file
		catch (e) {
			
			fs.writeFileSync(
				itemFile + ".json",
				JSON.stringify(item, null, "\t")
			);
		}
	}

	return numberTypeID;
};

/**
 * Get item (world object) type data.
 *
 * @param {number|string} itemTypeID Item type ID as numeric or string value.
 * @returns {object} Item type data.
 */
data.getItemType = function(itemTypeID) {
	
	// Look up string item type ID
	if (typeof itemTypeID === "number") {
		itemTypeID = this.items[itemTypeID];
	}
	
	return require("../data/items/" + itemTypeID);
};

/**
 * Match a valid date range (from data files with special date from/to values).
 *
 * @param {object} match Match data (battle from/to and target match date).
 * @param {string} dateFrom From date range value.
 * @param {string} dateTo To date range value.
 * @returns {object|boolean} Matched from/to range or boolean false on failure.
 */
data.matchDateRange = function(match, dateFrom, dateTo) {
	
	// Always match if date range is undefined
	if (!dateFrom && !dateTo) {
		
		return {
			from: match.from,
			to: match.to
		};
	}
	
	const range = {};
	
	if (dateFrom) {
		range.from = dateFrom;
	}
	
	if (dateTo) {
		range.to = dateTo;
	}
	
	// Parse each from/to date string
	for (const type in range) {
		
		const date = range[type];
		
		// Special "start" value means the start (min) date of the match
		if (date === "start") {
			range[type] = match.from;
		}
		// Special "end" value means the end (max) date of the match
		else if (date === "end") {
			range[type] = match.to;
		}
		// Other date format
		else {

			const dateParts = date.split("-");
			const momentDate = moment();

			momentDate.year(dateParts[0]);
			momentDate.month(Number(dateParts[1]) - 1);

			// Only month format (YYYY-MM) or start of the month format (YYYY-MM-start)
			if (dateParts[2] === undefined || dateParts[2] === "start") {
				momentDate.startOf("month");
			}
			// End of the month format (YYYY-MM-end)
			else if (dateParts[2] === "end") {
				momentDate.endOf("month");
			}
			// Full date format (YYYY-MM-DD)
			else {
				momentDate.date(Number(dateParts[2]));
			}

			range[type] = momentDate;
		}
	}

	// Match to the end of the month when dateTo is not provided
	if (!dateTo) {
		range.to = moment(range.from).endOf("month");
	}

	if (!match.date.isBefore(range.from, "day") &&
		!match.date.isAfter(range.to, "day")) {

		// Return from/to matching range as moment date objects
		return range;
	}

	return false;
};