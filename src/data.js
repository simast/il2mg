/** @copyright Simas Toleikis, 2015 */

import fs from "fs"
import path from "path"
import moment from "moment"
import addLazyProperty from "lazy-property"

// Application constants
export const APPLICATION_NAME = "il2mg"
export const APPLICATION_TITLE = "il2mg - Mission Generator"
export const APPLICATION_VERSION = "r11"
export const APPLICATION_COPYRIGHT = "(C) Simas Toleikis, 2015-2017"

// Coalitions
export const Coalition = Object.freeze({
	Neutral: 0,
	Allies: 1,
	Axis: 2
})

// Data tags for special airfield items
export const ItemTag = Object.freeze({
	Plane: -1, // Plane spot
	CargoTruck: -2, // Cargo truck
	FuelTruck: -3, // Fuel truck
	Car: -4, // Car vehicle
	AntiAircraftMG: -5, // Anti-aircraft (MG)
	AntiAircraftFlak: -6, // Anti-aircraft (Flak)
	AntiAircraftTrain: -7, // Anti-aircraft (Train platform)
	SearchLight: -8, // Search light
	LandingLight: -9, // Landing light
	Beacon: -10, // Beacon
	Windsock: -11, // Windsock
	Effect: -12, // Effect
	Wreck: -13 // Wreckage
})

// Data flags for airfield items
export const ItemFlag = Object.freeze({
	BlockDecoration: 1, // Decoration
	BlockFuel: 2, // Fuel item
	PlaneCamouflage: 1, // Camouflage plane spot
	EffectSmoke: 1, // House smoke effect
	EffectCampFire: 2, // Campfire effect
	EffectLandFire: 3, // Landing fire effect
	EffectSiren: 4, // Siren effect
	TaxiInvertible: 1, // Invertible taxi route
	TaxiRunway: 1, // Taxi runway point
	RouteStop: 1, // Route stop point
	RouteRoad: 2 // Route road formation
})

// Data directory index file key
const DATA_INDEX_FILE = "index"

class Data {

	constructor() {

		// Internal cache for data.load() function
		this.dataCache = Object.create(null)

		// Map of supported data formats/extensions
		this.dataFormats = Object.create(null)

		// NOTE: For performance reasons JSON5 files are only used in development mode
		// (while in production build data files are loaded using native JSON support).
		if (process.env.NODE_ENV !== "production") {
			this.dataFormats[".json5"] = require("json5").parse
		}

		// Always enable JSON format
		this.dataFormats[".json"] = JSON.parse

		// Main data directory path
		this.dataPath = "data"

		// Prepend app path when running as Electron application
		if (process.versions.electron) {
			this.dataPath = path.join(require("electron").app.getAppPath(), this.dataPath)
		}

		// Lazy load all static data
		addLazyProperty(this, "items", () => this.load(path.join("items", DATA_INDEX_FILE)) || [])
		addLazyProperty(this, "languages", () => this.load("languages"))
		addLazyProperty(this, "vehicles", () => this.load("vehicles"))
		addLazyProperty(this, "clouds", () => this.load("clouds"))
		addLazyProperty(this, "time", () => this.load("time"))
		addLazyProperty(this, "callsigns", () => this.load("callsigns"))
		addLazyProperty(this, "tasks", () => this.load("tasks"))

		// Load planes
		addLazyProperty(this, "planes", () => {

			const planes = Object.create(null)
			const planeData = this.load("planes")

			for (const planeGroup in planeData) {
				for (const planeID in planeData[planeGroup]) {
					planes[planeID] = planeData[planeGroup][planeID]
				}
			}

			return Object.freeze(planes)
		})

		// Load countries
		addLazyProperty(this, "countries", () => {

			const countries = this.load("countries")

			for (const countryID in countries) {

				const country = countries[countryID]
				const countryPath = path.join("countries", countryID)

				addLazyProperty(country, "formations", () => (
					this.load(path.join(countryPath, "formations"))
				))

				addLazyProperty(country, "names", () => this.load(path.join(countryPath, "names")))
				addLazyProperty(country, "ranks", () => this.load(path.join(countryPath, "ranks")))
			}

			return countries
		})

		// Load battles
		addLazyProperty(this, "battles", () => {

			const battles = this.load("battles")

			for (const battleID in battles) {

				const battle = battles[battleID]
				const battlePath = path.join("battles", battleID)

				addLazyProperty(battle, "blocks", () => this.load(path.join(battlePath, "blocks")))
				addLazyProperty(battle, "locations", () => this.load(path.join(battlePath, "locations")))
				addLazyProperty(battle, "fronts", () => this.load(path.join(battlePath, "fronts")))
				addLazyProperty(battle, "map", () => this.load(path.join(battlePath, "map")))
				addLazyProperty(battle, "weather", () => this.load(path.join(battlePath, "weather")))
				addLazyProperty(battle, "airfields", () => this.load(path.join(battlePath, "airfields")))
				addLazyProperty(battle, "roles", () => this.load(path.join(battlePath, "roles")))

				// Load battle unit data
				addLazyProperty(battle, "units", () => {

					const units = Object.create(null)
					const unitsData = this.load(path.join(battlePath, "units"))

					for (let unitCountryID in unitsData) {

						unitCountryID = parseInt(unitCountryID, 10)

						// Ignore invalid country IDs
						if (isNaN(unitCountryID) || !this.countries[unitCountryID]) {
							continue
						}

						const unitsDataCountry = unitsData[unitCountryID]

						// Build units list
						for (const unitGroup in unitsDataCountry) {
							for (const unitID in unitsDataCountry[unitGroup]) {

								units[unitID] = unitsDataCountry[unitGroup][unitID]
								units[unitID].country = unitCountryID
							}
						}
					}

					return Object.freeze(units)
				})
			}

			return battles
		})
	}

	/**
	 * Load a data file from a given path.
	 *
	 * @param {string} path Data file path (relative to data directory).
	 * @returns {*} Loaded data.
	 */
	load(itemPath) {

		if (typeof itemPath !== "string" || !itemPath) {
			throw new TypeError("Invalid data path.")
		}

		const {dataPath, dataCache, dataFormats} = this

		// Use cached data
		if (itemPath in dataCache) {
			return dataCache[itemPath]
		}

		const dataItemPath = path.join(dataPath, itemPath)
		let result = undefined

		// Try loading one of the supported data formats
		for (const extension in dataFormats) {

			const filePath = dataItemPath + extension

			if (fs.existsSync(filePath)) {

				result = Object.freeze(
					dataFormats[extension](fs.readFileSync(filePath, "utf-8"))
				)

				break
			}
		}

		// Check for data directory
		if (result === undefined) {

			let isDirectory = false

			if (fs.existsSync(dataItemPath)) {
				isDirectory = fs.lstatSync(dataItemPath).isDirectory()
			}

			if (isDirectory) {

				// Try loading directory index data file
				result = this.load(path.join(itemPath, DATA_INDEX_FILE))

				if (result === undefined) {

					// Read all data files in a directory
					const directoryData = fs
						.readdirSync(dataItemPath)
						.filter(fileName => {

							const isDirectory = fs.lstatSync(path.join(dataItemPath, fileName)).isDirectory()

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
								[fileKey]: this.load(path.join(itemPath, fileKey))
							})
						), Object.create(null))

					if (Object.keys(directoryData).length) {
						result = Object.freeze(directoryData)
					}
				}
			}
		}

		// Cache data result
		dataCache[itemPath] = result

		return result
	}

	/**
	 * Register a new item (world object) type.
	 *
	 * @param {object} item Item data.
	 * @returns {number} Item type ID.
	 */
	registerItemType(item) {

		if (typeof item !== "object" || !item.type || !item.script || !item.model) {
			throw new TypeError("Invalid item data.")
		}

		const {items, dataPath, dataFormats} = this

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

			const itemFile = path.join(dataPath, "items", stringTypeID)
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
	getItemType(itemTypeID) {

		// Look up string item type ID
		if (typeof itemTypeID === "number") {
			itemTypeID = this.items[itemTypeID]
		}

		return this.load(path.join("items", itemTypeID))
	}
}

export default new Data()

/**
 * Match a valid date range (from data files with special date from/to values).
 *
 * @param {object} match Match data (battle from/to and target match date).
 * @param {string} dateFrom From date range value.
 * @param {string} dateTo To date range value.
 * @returns {object|boolean} Matched from/to range or boolean false on failure.
 */
export function matchDateRange(match, dateFrom, dateTo) {

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