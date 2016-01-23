/** @copyright Simas Toleikis, 2015 */
"use strict";

const fs = require("fs");
const requireDir = require("require-directory");

const DATA = Object.create(null);

// Application name
DATA.name = "il2mg";

// Application version
DATA.version = "r4";

// Application copyright
DATA.copyright = "(C) Simas Toleikis, 2015-2016";

// Flag used to identify the data as binary (compiled to an executable)
// TODO: Improve the check for binary/compiled mode detection
DATA.isBinary = (process.argv[1].indexOf(".exe") !== -1);

// List of supported mission localization languages
DATA.languages = Object.freeze([
	"eng" // English
]);

// Data tags for special airfield items
DATA.itemTag = Object.freeze({
	PLANE: -1, // Plane spot
	TRUCK_CARGO: -2, // Cargo truck
	TRUCK_FUEL: -3, // Fuel truck
	CAR: -4, // Car vehicle
	AA_MG: -5, // Anti-aircraft (MG)
	AA_FLAK: -6, // Anti-aircraft (Flak)
	LIGHT_SEARCH: -7, // Search light
	LIGHT_LAND: -8, // Landing light
	BEACON: -9, // Beacon
	WINDSOCK: -10, // Windsock
	EFFECT: -11, // Effect
	WRECK: -12 // Wreckage
});

// Data flags for airfield items
DATA.itemFlag = Object.freeze({
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
DATA.frontLine = Object.freeze({
	BORDER: 1, // Border line
	ATTACK: 2 // Attack arrow
});

// Location item types
DATA.location = Object.freeze({
	VILLAGE: 1, // Small village
	TOWN: 2, // Medium town
	CITY: 3 // Large city
});

// Coalitions
DATA.coalition = Object.freeze({
	ALLIES: 1,
	AXIS: 2
});

// Territory types
DATA.territory = Object.freeze({
	FRONT: -1,
	UNKNOWN: 0
	// NOTE: Any positive territory type ID is a coalition ID
});

// Plane size constants (types/IDs)
DATA.planeSize = Object.freeze({
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
});

// Weather state/condition constants
DATA.weatherState = Object.freeze({
	PERFECT: 1,
	GOOD: 2,
	BAD: 3,
	EXTREME: 4
});

// Precipitation type constants
DATA.precipitation = Object.freeze({
	NONE: 0,
	RAIN: 1,
	SNOW: 2
});

// Flight states
// NOTE: Numeric (0..1) flight states represent aircraft in the air at various mission states
DATA.flightState = Object.freeze({
	START: "start", // Parking, engine not running
	TAXI: "taxi", // On the taxiway, engine running, taxiing to runway
	RUNWAY: "runway" // On the runway, engine running, ready for takeoff
});

// Common flight plan actions
DATA.planAction = Object.freeze({
	START: "start", // Initial start action
	TAKEOFF: "takeoff", // Taxi (optionally) and takeoff from airfield
	FORM: "form", // Form up (set formations and element cover)
	WAIT: "wait", // Wait for something (do nothing)
	FLY: "fly", // Fly to waypoint/location
	LAND: "land" // Land on airfield (ending the flight)
});

// Map colors as RGB array values
DATA.mapColor = Object.freeze({
	ATTACK: [156, 156, 156],
	// NOTE: Special color values that will change in-game based on user settings
	ENEMY: [10, 0, 0],
	FRIEND: [0, 0, 10]
});

// Briefing colors as HTML hex color values
DATA.briefingColor = Object.freeze({
	LIGHT: "#fbfbfb",
	DARK: "#959595"
});

// Load all static data
(() => {

	// NOTE: For performance reasons JSON files in the binary/compiled mode will
	// be loaded using native JSON object.
	let useJSON5 = !DATA.isBinary;

	if (useJSON5) {

		// NOTE: Having JSON5 module name as two separate string literals will trick
		// enclose to not included it in the binary file when compiling.
		const JSON5 = require("json" + "5");

		// Add new require() loader to handle JSON5 data files
		require.extensions[".json5"] = (module, filename) => {
			module.exports = JSON5.parse(fs.readFileSync(filename, "utf8"));
		};
		
		// JSON5 support for require-directory
		requireDir.defaults.extensions.push("json5");
	}

	DATA.vehicles = Object.freeze(require("../data/vehicles"));
	DATA.clouds = Object.freeze(require("../data/clouds"));
	DATA.time = Object.freeze(require("../data/time"));
	DATA.items = Object.freeze(require("../data/items"));
	DATA.effects = Object.freeze(require("../data/effects"));
	DATA.grounds = Object.freeze(require("../data/grounds"));
	DATA.callsigns = Object.freeze(require("../data/callsigns"));
	DATA.countries = Object.freeze(require("../data/countries"));
	DATA.battles = Object.freeze(require("../data/battles"));
	DATA.tasks = Object.freeze(requireDir(module, "../data/tasks"));
	DATA.planes = Object.create(null);

	// Load countries
	for (const countryID in DATA.countries) {

		const country = DATA.countries[countryID];
		const countryPath = "../data/countries/" + countryID + "/";

		country.formations = require(countryPath + "formations");
		country.names = require(countryPath + "names");
		country.ranks = require(countryPath + "ranks");
	}

	// Load planes
	const planeData = requireDir(module, "../data/planes");
	
	for (const planeGroup in planeData) {
		for (const planeID in planeData[planeGroup]) {
			DATA.planes[planeID] = planeData[planeGroup][planeID];
		}
	}

	Object.freeze(DATA.planes);

	// Load battles
	// TODO: Load only required mission battle data
	for (const battleID in DATA.battles) {

		const battle = DATA.battles[battleID];
		const battlePath = "../data/battles/" + battleID + "/";

		battle.countries = [];
		battle.blocks = Object.freeze(require(battlePath + "blocks"));
		battle.locations = Object.freeze(require(battlePath + "locations"));
		battle.fronts = Object.freeze(require(battlePath + "fronts"));
		battle.map = Object.freeze(require(battlePath + "map"));
		battle.weather = Object.freeze(require(battlePath + "weather"));
		battle.airfields = requireDir(module, battlePath + "airfields");
		battle.roles = Object.freeze(requireDir(module, battlePath + "roles/"));
		battle.units = Object.create(null);

		// Load battle unit data
		const unitsData = requireDir(module, battlePath + "units/");

		for (let unitCountryID in unitsData) {

			unitCountryID = parseInt(unitCountryID, 10);

			// Ignore invalid country IDs
			if (isNaN(unitCountryID) || !DATA.countries[unitCountryID]) {
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
}());

/**
 * Register a new or update existing item (world object) type.
 *
 * @param {object} item Item data.
 * @returns {number} Item type ID.
 */
DATA.registerItemType = function(item) {

	if (typeof item !== "object" || !item.type || !item.script || !item.model) {
		throw new TypeError("Invalid item data.");
	}

	// Initialize items data
	if (typeof this.items !== "object") {

		this.items = {
			items: [],
			index: {}
		};
	}

	const items = this.items.items;
	const index = this.items.index;

	// Lowercase and trim script/model paths
	item.script = item.script.trim().toLowerCase();
	item.model = item.model.trim().toLowerCase();

	// Try to find existing item type ID by script index
	let itemTypeID = index[item.script];

	// Update existing item type data
	if (itemTypeID !== undefined) {

		items[itemTypeID].type = item.type;
		items[itemTypeID].script = item.script;
		items[itemTypeID].model = item.model;
	}
	// Add new item type
	else {

		itemTypeID = items.push(item) - 1;

		// Create script index
		index[item.script] = itemTypeID;
	}

	return itemTypeID;
};

/**
 * Get item (world object) type data.
 *
 * @param {number|string} itemTypeID Item type ID or script name.
 * @returns {object} Item type data.
 */
DATA.getItemType = function(itemTypeID) {

	// Look up item type ID by script name
	if (typeof itemTypeID === "string") {
		itemTypeID = this.items.index[itemTypeID.trim().toLowerCase()];
	}

	const itemType = this.items.items[itemTypeID];

	if (typeof itemType !== "object") {
		throw new TypeError("Invalid item type ID.");
	}

	return itemType;
};

global.DATA = DATA;