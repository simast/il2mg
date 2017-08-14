/** @copyright Simas Toleikis, 2015 */
"use strict"

const fs = require("fs")
const path = require("path")
const moment = require("moment")

// Main data directory name
const DATA_DIRECTORY = "data"
const DATA_DIRECTORY_INDEX_FILE = "index"

const data = module.exports = Object.create(null)

// Application name
data.name = "il2mg"

// Application version
data.version = "r11"

// Application copyright
data.copyright = "(C) Simas Toleikis, 2015-2017"

// List of supported mission localization languages
data.languages = Object.freeze([
	"eng", // English (default)
	"ger", // German
	"pol", // Polish
	"rus", // Russian
	"spa", // Spanish
	"fra" // French
])

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
})

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
})

// Front line item types
data.frontLine = Object.freeze({
	BORDER: 1, // Border line
	ATTACK: 2 // Attack arrow
})

// Location item types
data.location = Object.freeze({
	VILLAGE: 1, // Small village
	TOWN: 2, // Medium town
	CITY: 3, // Large city
	AIRFIELD: 4 // Airfield
})

// Map season types
// NOTE: Order is important (used when defining plane skins for each season)!
data.season = Object.freeze({
	SPRING: "spring",
	SUMMER: "summer",
	AUTUMN: "autumn",
	WINTER: "winter",
	DESERT: "desert"
})

// Altitude level types
data.altitudeLevel = Object.freeze({
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high"
})

// Coalitions
data.coalition = Object.freeze({
	ALLIES: 1,
	AXIS: 2
})

// Territory types
data.territory = Object.freeze({
	FRONT: -1,
	UNKNOWN: 0
	// NOTE: Any positive territory type ID is a coalition ID
})

// Plane size constants (types/IDs)
data.planeSize = Object.freeze({
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	HUGE: 4
})

// Weather state/condition constants
data.weatherState = Object.freeze({
	PERFECT: 1,
	GOOD: 2,
	BAD: 3,
	EXTREME: 4
})

// Precipitation type constants
data.precipitation = Object.freeze({
	NONE: 0,
	RAIN: 1,
	SNOW: 2
})

// Flight states
// NOTE: Numeric [0..1) value state represent aircraft in the air.
data.flightState = Object.freeze({
	START: "start", // Parking, engine not running
	TAXI: "taxi", // On the taxiway, engine running, taxiing to runway
	RUNWAY: "runway" // On the runway, engine running, ready for takeoff
})

// Common flight plan activity types
data.activityType = Object.freeze({
	START: "start", // Initial start activity
	TAKEOFF: "takeoff", // Taxi (optionally) and takeoff from airfield
	FORM: "form", // Form up (set formations and element cover)
	WAIT: "wait", // Wait for something (do nothing)
	FLY: "fly", // Fly to waypoint/location
	LAND: "land", // Land on airfield (ending the flight)
	END: "end" // End flight activity
})

// Map colors as RGB array values
data.mapColor = Object.freeze({
	ATTACK: [156, 156, 156],
	ROUTE: [52, 52, 52],
	// NOTE: Special color values that will change in-game based on user settings
	ENEMY: [10, 0, 0],
	FRIEND: [0, 0, 10]
})

// Briefing colors as HTML hex color values
data.briefingColor = Object.freeze({
	LIGHT: "#fbfbfb",
	DARK: "#959595"
})

// Internal cache for data.load() function
const dataCache = Object.create(null)

// Map of supported data formats/extensions
const dataFormats = Object.create(null)

// NOTE: For performance reasons production build is not using JSON5 format!
if (process.env.NODE_ENV !== "production") {
	dataFormats[".json5"] = require("json5").parse
}

// Always enable JSON format
dataFormats[".json"] = JSON.parse

/**
 * Load a data file from a given path.
 *
 * @param {string} path Data file path (relative to data directory).
 * @returns {*} Loaded data.
 */
data.load = function(dataPath) {

	if (typeof dataPath !== "string" || !dataPath) {
		throw new TypeError("Invalid data path.")
	}

	// Use cached data
	if (dataPath in dataCache) {
		return dataCache[dataPath]
	}

	const dataDirPath = path.join(DATA_DIRECTORY, dataPath)
	let result = undefined

	// Try loading one of the supported data formats
	for (const extension in dataFormats) {

		const dataFilePath = dataDirPath + extension

		if (fs.existsSync(dataFilePath)) {

			result = Object.freeze(
				dataFormats[extension](fs.readFileSync(dataFilePath, "utf-8"))
			)

			break
		}
	}

	// Check for data directory
	if (result === undefined) {

		let isDirectory = false

		if (fs.existsSync(dataDirPath)) {
			isDirectory = fs.lstatSync(dataDirPath).isDirectory()
		}

		if (isDirectory) {

			// Try loading directory index data file
			result = data.load(path.join(dataPath, DATA_DIRECTORY_INDEX_FILE))

			if (result === undefined) {

				// Read all data files in a directory
				const directoryData = fs
					.readdirSync(dataDirPath)
					.filter(fileName => {

						const isDirectory = fs.lstatSync(path.join(dataDirPath, fileName)).isDirectory()

						// Always recurse into child directories when index data file is missing
						if (isDirectory) {
							return true
						}

						return path.extname(fileName) in dataFormats
					})
					.map(fileName => path.basename(fileName, path.extname(fileName)))
					.filter((fileKey, index, array) => array.indexOf(fileKey) === index)
					.reduce((result, fileKey) => (
						Object.assign(result, {
							[fileKey]: data.load(path.join(dataPath, fileKey))
						})
					), {})

				if (Object.keys(directoryData).length) {
					result = Object.freeze(directoryData)
				}
			}
		}
	}

	// Cache data result
	dataCache[dataPath] = result

	return result
}

// Load all static data
;(() => {

	data.items = []
	data.vehicles = data.load("vehicles")
	data.clouds = data.load("clouds")
	data.time = data.load("time")
	data.callsigns = data.load("callsigns")
	data.countries = data.load("countries")
	data.battles = data.load("battles")
	data.tasks = data.load("tasks")
	data.planes = Object.create(null)

	// Load items index file
	if (fs.existsSync(path.join(DATA_DIRECTORY, "items", DATA_DIRECTORY_INDEX_FILE) + ".json")) {
		data.items = data.load("items")
	}

	// Load countries
	for (const countryID in data.countries) {

		const country = data.countries[countryID]
		const countryPath = path.join("countries", countryID)

		country.formations = data.load(path.join(countryPath, "formations"))
		country.names = data.load(path.join(countryPath, "names"))
		country.ranks = data.load(path.join(countryPath, "ranks"))
	}

	// Load planes
	const planeData = data.load("planes")

	for (const planeGroup in planeData) {
		for (const planeID in planeData[planeGroup]) {
			data.planes[planeID] = planeData[planeGroup][planeID]
		}
	}

	Object.freeze(data.planes)

	// Load battles
	// TODO: Load only required mission battle data
	for (const battleID in data.battles) {

		const battle = data.battles[battleID]
		const battlePath = path.join("battles", battleID)

		battle.countries = []
		battle.blocks = data.load(path.join(battlePath, "blocks"))
		battle.locations = data.load(path.join(battlePath, "locations"))
		battle.fronts = data.load(path.join(battlePath, "fronts"))
		battle.map = data.load(path.join(battlePath, "map"))
		battle.weather = data.load(path.join(battlePath, "weather"))
		battle.airfields = data.load(path.join(battlePath, "airfields"))
		battle.roles = data.load(path.join(battlePath, "roles"))
		battle.units = Object.create(null)

		// Load battle unit data
		const unitsData = data.load(path.join(battlePath, "units"))

		for (let unitCountryID in unitsData) {

			unitCountryID = parseInt(unitCountryID, 10)

			// Ignore invalid country IDs
			if (isNaN(unitCountryID) || !data.countries[unitCountryID]) {
				continue
			}

			const unitsDataCountry = unitsData[unitCountryID]

			// Build units list
			for (const unitGroup in unitsDataCountry) {
				for (const unitID in unitsDataCountry[unitGroup]) {

					battle.units[unitID] = unitsDataCountry[unitGroup][unitID]
					battle.units[unitID].country = unitCountryID
				}
			}

			// Register country as part of the battle
			battle.countries.push(unitCountryID)
		}

		Object.freeze(battle.countries)
		Object.freeze(battle.units)
	}
})()

/**
 * Register a new item (world object) type.
 *
 * @param {object} item Item data.
 * @returns {number} Item type ID.
 */
data.registerItemType = function(item) {

	if (typeof item !== "object" || !item.type || !item.script || !item.model) {
		throw new TypeError("Invalid item data.")
	}

	const {items} = data

	// Lowercase and trim script/model paths
	item.script = item.script.trim().toLowerCase()
	item.model = item.model.trim().toLowerCase()

	// Item type ID as a string (lowercase file name without extension)
	const stringTypeID = path.win32.basename(item.script, ".txt")

	// Try to find existing item type ID by script index
	let numberTypeID = items.indexOf(stringTypeID)

	// Add new item type
	if (numberTypeID === -1) {

		numberTypeID = items.push(stringTypeID) - 1

		const itemFile = path.join(DATA_DIRECTORY, "items", stringTypeID)
		const itemFileExists = Boolean(Object.keys(dataFormats).find(extension => (
			fs.existsSync(itemFile + extension)
		)))

		// Write item JSON file
		if (!itemFileExists) {

			fs.writeFileSync(
				itemFile + ".json",
				JSON.stringify(item, null, "\t")
			)
		}
	}

	return numberTypeID
}

/**
 * Get item (world object) type data.
 *
 * @param {number|string} itemTypeID Item type ID as numeric or string value.
 * @returns {object} Item type data.
 */
data.getItemType = function(itemTypeID) {

	// Look up string item type ID
	if (typeof itemTypeID === "number") {
		itemTypeID = this.items[itemTypeID]
	}

	return data.load(path.join("items", itemTypeID))
}

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
		}
	}

	const range = {}

	if (dateFrom) {
		range.from = dateFrom
	}

	if (dateTo) {
		range.to = dateTo
	}

	// Parse each from/to date string
	for (const type in range) {

		const date = range[type]

		// Special "start" value means the start (min) date of the match
		if (date === "start") {
			range[type] = match.from
		}
		// Special "end" value means the end (max) date of the match
		else if (date === "end") {
			range[type] = match.to
		}
		// Other date format
		else {

			const dateParts = date.split("-")
			const momentDate = moment()

			momentDate.year(dateParts[0])
			momentDate.month(Number(dateParts[1]) - 1)

			// Only month format (YYYY-MM) or start of the month format (YYYY-MM-start)
			if (dateParts[2] === undefined || dateParts[2] === "start") {
				momentDate.startOf("month")
			}
			// End of the month format (YYYY-MM-end)
			else if (dateParts[2] === "end") {
				momentDate.endOf("month")
			}
			// Full date format (YYYY-MM-DD)
			else {
				momentDate.date(Number(dateParts[2]))
			}

			range[type] = momentDate
		}
	}

	// Match to the end of the month when dateTo is not provided
	if (!dateTo) {
		range.to = moment(range.from).endOf("month")
	}

	if (!match.date.isBefore(range.from, "day") &&
		!match.date.isAfter(range.to, "day")) {

		// Return from/to matching range as moment date objects
		return range
	}

	return false
}