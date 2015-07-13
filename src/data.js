/** @copyright Simas Toleikis, 2015 */
"use strict";

var fs = require("fs");
var requireDir = require("require-directory");

var DATA = Object.create(null);

// Application name
DATA.name = "il2mg";

// Application version
DATA.version = "r1";

// Application copyright
DATA.copyright = "(C) Simas Toleikis, 2015";

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
	ATTACK: 2, // Attack arrow
	DEFEND: 3 // Defensive line
});

// Plane size constants (types/IDs)
DATA.planeSize = Object.freeze({
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
});

// Flight states
// NOTE: Numeric (0..1) flight states represent aircraft in the air at various mission states
DATA.flightState = Object.freeze({
	START: "start", // Parking, engine not running
	TAXI: "taxi", // On the taxiway, engine running, taxiing to runway
	RUNWAY: "runway" // On the runway, engine running, ready for takeoff
});

// Flight plan actions
DATA.planAction = Object.freeze({
	START: "start", // Initial start action
	TAKEOFF: "takeoff", // Taxi (optionally) and takeoff from airfield
	WAIT: "wait", // Wait for something (do nothing)
	FLY: "fly", // Fly to waypoint/location
	LAND: "land" // Land on airfield (ending the flight)
});

// Briefing colors as HTML hex color values
DATA.briefingColor = Object.freeze({
	LIGHT: "#fbfbfb",
	DARK: "#848484"
});

// Load all static data
(function() {
	
	var useJSON5 = true;
	
	// NOTE: Having JSON5 module name as two separate string literals will trick
	// enclose to not included it in the binary file. Thus JSON files in the binary
	// will be loaded using native JSON object (for performance reasons).
	try {
		var JSON5 = require("json" + "5");
	}
	catch (e) {
		useJSON5 = false;
	}
	
	if (useJSON5) {
		
		useJSON5 = require.extensions[".json"];
		
		// Temporary override native JSON loader to handle JSON5 data files
		require.extensions[".json"] = function(module, filename) {
			module.exports = JSON5.parse(fs.readFileSync(filename, "utf8"));
		};
	}

	DATA.vehicles = Object.freeze(require("../data/vehicles"));
	DATA.clouds = Object.freeze(require("../data/clouds"));
	DATA.coalitions = Object.freeze(require("../data/coalitions"));
	DATA.time = Object.freeze(require("../data/time"));
	DATA.items = Object.freeze(require("../data/items"));
	DATA.effects = Object.freeze(require("../data/effects"));
	DATA.grounds = Object.freeze(require("../data/grounds"));
	DATA.callsigns = Object.freeze(require("../data/callsigns"));
	DATA.countries = Object.freeze(require("../data/countries"));
	DATA.battles = Object.freeze(require("../data/battles"));
	DATA.planes = Object.create(null);

	// Load country info
	for (var countryID in DATA.countries) {

		var country = DATA.countries[countryID];
		var countryPath = "../data/countries/" + countryID + "/";

		country.ranks = require(countryPath + "ranks");
		country.names = require(countryPath + "names");
	}
	
	// Load plane data
	var planeData = requireDir(module, "../data/planes");
	
	for (var planeGroup in planeData) {
		for (var planeID in planeData[planeGroup]) {
			DATA.planes[planeID] = planeData[planeGroup][planeID];
		}
	}
	
	Object.freeze(DATA.planes);

	// Load battle info
	// TODO: Load only required mission battle data
	for (var battleID in DATA.battles) {

		var battle = DATA.battles[battleID];
		var battlePath = "../data/battles/" + battleID + "/";

		battle.countries = [];
		battle.blocks = Object.freeze(require(battlePath + "blocks"));
		battle.fronts = Object.freeze(require(battlePath + "fronts"));
		battle.map = Object.freeze(require(battlePath + "map"));
		battle.sun = Object.freeze(require(battlePath + "sun"));
		battle.weather = Object.freeze(require(battlePath + "weather"));
		battle.airfields = requireDir(module, battlePath + "airfields");
		battle.units = Object.create(null);
		
		// Load battle unit data
		var unitsData = requireDir(module, battlePath + "units/");
		
		for (var unitCountryID in unitsData) {
			
			unitCountryID = parseInt(unitCountryID, 10);
			
			// Ignore invalid country IDs
			if (isNaN(unitCountryID) || !DATA.countries[unitCountryID]) {
				continue;
			}
			
			var unitsDataCountry = unitsData[unitCountryID];
			
			// Build units list
			for (var unitGroup in unitsDataCountry) {
				for (var unitID in unitsDataCountry[unitGroup]) {
					
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

	// Restore original/native JSON loader
	if (useJSON5) {
		require.extensions[".json"] = useJSON5;
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

	var items = this.items.items;
	var index = this.items.index;

	// Lowercase and trim script/model paths
	item.script = item.script.trim().toLowerCase();
	item.model = item.model.trim().toLowerCase();

	// Try to find existing item type ID by script index
	var itemTypeID = index[item.script];

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

	var itemType = this.items.items[itemTypeID];

	if (typeof itemType !== "object") {
		throw new TypeError("Invalid item type ID.");
	}

	return itemType;
};

global.DATA = DATA;