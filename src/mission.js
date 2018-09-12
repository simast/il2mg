import fs from "fs"
import os from "os"
import path from "path"
import Random from "random-js"
import data, {Coalition, APPLICATION_NAME, APPLICATION_VERSION} from "./data"
import log from "./log"
import Item from "./item"

// Mission make parts
import makeBattle from "./make/battle"
import makeChoice from "./make/choice"
import makeDate from "./make/date"
import makeMap from "./make/map"
import makeBubble from "./make/bubble"
import makeTime from "./make/time"
import makePeople from "./make/people"
import makePlanes from "./make/planes"
import makeUnits from "./make/units"
import makeVehicles from "./make/vehicles"
import makeWeather from "./make/weather"
import makeLocations from "./make/locations"
import makeAirfields from "./make/airfields"
import makeTasks from "./make/tasks"
import makeFronts from "./make/fronts"
import makeBlocks from "./make/blocks"
import makeFormations from "./make/formations"
import makeForces from "./make/forces"
import makeBriefing from "./make/briefing"

// Mission file extensions
const FILE_EXT_TEXT = "Mission"
const FILE_EXT_BINARY = "msnbin"
const FILE_EXT_META = "il2mg"

// List of mission parameters that make up the complex seed value
// NOTE: The order is important and is used to define parameter sequence
const COMPLEX_SEED_PARAMS = [
	"seed", // Base seed value (numeric)
	"debug",
	"battle",
	"date",
	"time",
	"coalition",
	"country",
	"task",
	"pilot",
	"plane",
	"state",
	"airfield",
	"weather",
	"unit"
]

export default class Mission {

	/**
	 * Mission constructor.
	 *
	 * @param {object} params Desired mission parameters.
	 * @constructor
	 */
	constructor(params) {

		this.items = [] // Items list
		this.lang = [] // Language data
		this.make = [] // Delayed make callbacks list
		this.params = params // Desired mission parameters

		// Last item index value
		this.lastIndex = 0

		log.I("Making mission...")

		// Reserve an empty localization string (used in binary mission generation
		// for items without LCName or LCDesc properties).
		this.getLC("")

		// Initialize random number generator
		this.initRand(params)

		// Debug mode
		this.debug = (this.params.debug ? this.params.debug : false)

		log.profile("Making")

		// Make mission parts
		// NOTE: Order is very important!
		;[
			makeBattle,
			makeChoice,
			makeDate,
			makeMap,
			makeBubble,
			makeTime,
			makePeople,
			makePlanes,
			makeUnits,
			makeVehicles,
			makeWeather,
			makeLocations,
			makeAirfields,
			makeTasks,
			makeFronts,
			makeBlocks,
			makeFormations,
			makeForces,
			makeBriefing
		].forEach(makePart => makePart.call(this))

		// Execute all delayed (last) mission make callbacks
		for (const makeCallback of this.make) {
			makeCallback()
		}

		log.profile("Making")
	}

	/**
	 * Initialize random number generator.
	 *
	 * @param {object} params Desired mission parameters.
	 */
	initRand(params) {

		let complexSeed

		// Initialize from existing seed
		if (params.seed) {

			// Make sure the seed parameter is exclusive and is not used together with
			// other complex seed parameters.
			for (let i = 1; i < COMPLEX_SEED_PARAMS.length; i++) {

				const param = COMPLEX_SEED_PARAMS[i]

				if (param in params) {
					throw ['Cannot use "%s" parameter together with seed.', param]
				}
			}

			// Try a complex seed value (with Base64 parameters)
			try {
				complexSeed = JSON.parse(new Buffer(params.seed, "base64").toString("utf-8"))
			}
			catch (e) {}

			if (typeof complexSeed === "object") {

				// Restore parameters from complex seed value
				COMPLEX_SEED_PARAMS.forEach((param, paramIndex) => {

					if (paramIndex in complexSeed) {
						params[param] = complexSeed[paramIndex]
					}
				})
			}

			// Handle simple seed value (numeric)
			if (/^[0-9]+$/.test(params.seed)) {

				const seedNumber = parseInt(params.seed, 10)

				if (!isNaN(seedNumber) && seedNumber > 0) {
					this.seed = seedNumber
				}
			}

			// Validate seed value
			if (!this.seed) {
				throw ["Invalid mission seed!", {seed: params.seed}]
			}
		}
		// Create a new seed
		else {

			// NOTE: Ignoring the first number from Date.now() to shorten the seed
			this.seed = Date.now() % 1000000000000

			// Check seed affecting parameters and create a complex seed if necessary
			COMPLEX_SEED_PARAMS.forEach((param, paramIndex) => {

				if (param in params) {

					complexSeed = complexSeed || Object.create(null)
					complexSeed[paramIndex] = params[param]
				}
			})

			if (complexSeed) {
				complexSeed[0] = this.seed
			}
		}

		// Initialize random number generator
		const mtRand = Random.engines.mt19937()
		mtRand.seed(this.seed)
		this.rand = new Random(mtRand)

		let seedParam

		// Save seed value as a localization string
		if (complexSeed) {
			seedParam = new Buffer(JSON.stringify(complexSeed), "utf-8").toString("base64")
		}
		else {
			seedParam = this.seed.toString()
		}

		// Save seed param value as a localization string
		this.getLC(seedParam)

		// Log seed param value
		log.I("Seed:", seedParam)
	}

	/**
	 * Create a new mission item.
	 *
	 * @param {string|object} itemType Item type as an object or name.
	 * @param {mixed} [parent] Add to the mission (true) or parent item (object).
	 */
	createItem(itemType, parent) {

		let itemData

		// Item type as an object with meta data
		if (typeof itemType === "object") {

			itemData = itemType
			itemType = itemData.type
		}

		if (!Item[itemType]) {
			throw new TypeError("Invalid item type value.")
		}

		// Add item to mission if parent is not specified
		if (parent !== false && !(parent instanceof Item)) {
			parent = this
		}

		const item = new Item[itemType]()

		if (item.hasIndex) {

			// Set unique item index
			Object.defineProperty(item, "Index", {
				enumerable: true,
				value: ++this.lastIndex
			})
		}

		// Set item mission reference
		Object.defineProperty(item, "mission", {
			value: this
		})

		// Set common item data
		if (itemData) {

			if (itemData.model) {
				item.Model = itemData.model
			}

			if (itemData.script) {
				item.Script = itemData.script
			}

			if (itemData.durability) {
				item.Durability = itemData.durability
			}
		}

		// Add item to parent item object
		if (parent) {
			parent.addItem(item)
		}

		return item
	}

	/**
	 * Add a new item to the mission.
	 *
	 * @param {Item} item Item object.
	 */
	addItem(item) {

		if (!(item instanceof Item)) {
			throw new TypeError("Invalid item value.")
		}

		// Add child item
		this.items.push(item)

		// Set child item parent reference
		Object.defineProperty(item, "parent", {
			value: this,
			configurable: true
		})
	}

	/**
	 * Get localized mission language code for a given string.
	 *
	 * @param {string} text Text string.
	 * @returns {number} Localized mission language code.
	 */
	getLC(text) {

		if (typeof text !== "string") {
			throw new TypeError("Invalid mission language string.")
		}

		text = text.trim()

		let languageCode = this.lang.indexOf(text)

		if (languageCode < 0) {
			languageCode = this.lang.push(text) - 1
		}

		return languageCode
	}

	/**
	 * Get unique callsign.
	 *
	 * @param {string} type Callsign type.
	 * @returns {object} Unique callsign.
	 */
	getCallsign(type) {

		if (!data.callsigns[type]) {
			throw new TypeError("Invalid callsign type value.")
		}

		// Track last used callsign index
		if (!this.lastCallsign) {
			this.lastCallsign = Object.create(null)
		}

		// Initialize/shuffle callsign list data
		if (this.lastCallsign[type] === undefined) {

			this.rand.shuffle(data.callsigns[type])
			this.lastCallsign[type] = 0
		}
		// Use next available callsign
		else {

			this.lastCallsign[type]++

			// Cycle callsign list
			if (this.lastCallsign[type] >= data.callsigns[type].length) {
				this.lastCallsign[type] = 0
			}
		}

		const callsign = data.callsigns[type][this.lastCallsign[type]]

		// Return selected callsign info
		return {
			id: callsign[0],
			name: callsign[1]
		}
	}

	/**
	 * Get opposing (enemy) coalition.
	 *
	 * @param {number} coalition Friendly coalition ID.
	 * @returns {number} Enemy coalition ID.
	 */
	getEnemyCoalition(coalition) {

		if (coalition === Coalition.Allies) {
			return Coalition.Axis
		}
		else if (coalition === Coalition.Axis) {
			return Coalition.Allies
		}

		return Coalition.Neutral // Unknown/neutral
	}

	/**
	 * Save mission files.
	 *
	 * @param {string} fileName Mission file name.
	 * @returns {Promise} Promise object.
	 */
	async save(fileName) {

		const {params, debug} = this
		const format = params.format || Mission.FORMAT_BINARY
		const promises = []

		log.I("Saving mission...")

		let fileDir = ""
		let fileBase

		// Use specified mission file path and/or name
		if (fileName && fileName.length) {

			let isDirectory = false

			if (fs.existsSync(fileName)) {
				isDirectory = fs.statSync(fileName).isDirectory()
			}

			if (isDirectory) {
				fileDir = fileName
			}
			else {

				fileDir = path.dirname(fileName)
				fileBase = path.basename(fileName, path.extname(fileName))
			}
		}

		// Generate unique mission file name (based on seed value)
		if (!fileBase) {
			fileBase = APPLICATION_NAME + "-" + this.seed
		}

		// Make specified directory path
		if (fileDir && !fs.existsSync(fileDir)) {
			fs.mkdirSync(fileDir)
		}

		fileName = path.join(fileDir, fileBase)

		// Save text format file
		if (format === Mission.FORMAT_TEXT || (debug && !params.format)) {
			promises.push(this.saveText(fileName))
		}

		// Save binary format file
		if (format === Mission.FORMAT_BINARY || (debug && !params.format)) {
			promises.push(this.saveBinary(fileName))
		}

		// Save language files
		promises.push(this.saveLang(fileName))

		// Save metadata file
		if (params.meta) {
			promises.push(this.saveMeta(fileName))
		}

		return Promise.all(promises)
	}

	/**
	 * Save text .Mission file.
	 *
	 * @param {string} fileName Mission file name (without extension).
	 * @returns {Promise} Promise object.
	 */
	async saveText(fileName) {

		const profileName = "Saving ." + FILE_EXT_TEXT

		log.profile(profileName)

		const promise = new Promise((resolve, reject) => {

			const fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_TEXT)

			// Write .Mission data
			fileStream.once("open", () => {

				// Required mission file header
				fileStream.write("# Mission File Version = 1.0;" + os.EOL)

				// Write mission items
				this.items.forEach(item => {
					fileStream.write(os.EOL + item.toString() + os.EOL)
				})

				// Required mission file footer
				fileStream.write(os.EOL + "# end of file")

				fileStream.end()
			})

			fileStream.once("finish", resolve)
			fileStream.once("error", reject)
		})

		promise.then(() => {
			log.profile(profileName)
		})

		return promise
	}

	/**
	 * Save binary .msnbin file.
	 *
	 * @param {string} fileName Mission file name (without extension).
	 * @returns {Promise} Promise object.
	 */
	async saveBinary(fileName) {

		const profileName = "Saving ." + FILE_EXT_BINARY

		log.profile(profileName)

		const promise = new Promise((resolve, reject) => {

			const optionsBuffers = []
			const itemBuffers = []
			let numItems = 0

			// Create index tables
			const indexTables = {
				name: new BinaryStringTable(32, 100),
				desc: new BinaryStringTable(32, 100),
				model: new BinaryStringTable(64, 100),
				skin: new BinaryStringTable(128, 100),
				script: new BinaryStringTable(128, 100),
				damage: new BinaryDamageTable()
			}

			// Collect binary representation of all mission items
			;(function walkItems(items) {

				items.forEach(item => {

					// Process Group item child items
					if (item instanceof Item.Group) {

						if (item.items && item.items.length) {
							walkItems(item.items)
						}
					}
					// Get item binary representation (data buffers)
					else {

						for (const buffer of item.toBinary(indexTables)) {

							// Collect Options item buffers
							if (item instanceof Item.Options) {
								optionsBuffers.push(buffer)
							}
							// Process normal item buffers
							else if (buffer.length) {
								itemBuffers.push(buffer)
							}
						}

						// Process linked item entity
						if (item.entity) {

							for (const buffer of item.entity.toBinary(indexTables)) {
								itemBuffers.push(buffer)
							}

							numItems++
						}

						numItems++
					}
				})

			})(this.items)

			if (!optionsBuffers.length) {
				throw new Error()
			}

			const fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_BINARY)

			fileStream.once("open", () => {

				// Write Options item buffers (has to be the first one in the file)
				while (optionsBuffers.length) {
					fileStream.write(optionsBuffers.shift())
				}

				const indexTableNames = Object.keys(indexTables)
				const itlhBuffer = new Buffer(7) // Index table list header buffer
				const bsBuffer = new Buffer(4) // Item size buffer

				// Write index table list header (number of index tables + 3 unknown bytes)
				itlhBuffer.writeUInt32LE(indexTableNames.length, 0)
				itlhBuffer.fill(0, 4)
				fileStream.write(itlhBuffer)

				// Write index tables
				indexTableNames.forEach(tableName => {
					fileStream.write(indexTables[tableName].toBinary())
				})

				// Write items size buffer
				bsBuffer.writeUInt32LE(numItems, 0)
				fileStream.write(bsBuffer)

				// Write item buffers
				while (itemBuffers.length) {
					fileStream.write(itemBuffers.shift())
				}

				fileStream.end()
			})

			fileStream.once("finish", resolve)
			fileStream.once("error", reject)
		})

		promise.then(() => {
			log.profile(profileName)
		})

		return promise
	}

	/**
	 * Save .eng and other localization files.
	 *
	 * @param {string} fileName Mission file name (without extension).
	 * @returns {Promise} Promise object.
	 */
	async saveLang(fileName) {

		const promises = []
		let languages = this.params.lang

		// Make all languages
		if (languages === true) {
			languages = data.languages
		}
		// Generate default (first) language only
		else if (!languages || !languages.length) {
			languages = data.languages.slice(0, 1)
		}

		// Make language files
		languages.forEach(lang => {

			const profileName = "Saving ." + lang

			log.profile(profileName)

			const promise = new Promise((resolve, reject) => {

				const fileStream = fs.createWriteStream(fileName + "." + lang)

				fileStream.once("open", () => {

					// Write UCS2 little-endian BOM
					fileStream.write("FFFE", "hex")

					// Write language data
					this.lang.forEach((value, index) => {
						fileStream.write(index + ":" + value + os.EOL, "ucs2")
					})

					fileStream.end()
				})

				fileStream.once("finish", resolve)
				fileStream.once("error", reject)
			})

			promise.then(() => {
				log.profile(profileName)
			})

			promises.push(promise)
		})

		return Promise.all(promises)
	}

	/**
	 * Save metadata .il2mg file.
	 *
	 * @param {string} fileName Mission file name (without extension).
	 * @returns {Promise} Promise object.
	 */
	async saveMeta(fileName) {

		const profileName = "Saving ." + FILE_EXT_META

		log.profile(profileName)

		const promise = new Promise((resolve, reject) => {

			const fileStream = fs.createWriteStream(fileName + "." + FILE_EXT_META)

			// Write .il2mg data
			fileStream.once("open", () => {

				fileStream.write(JSON.stringify({
					version: APPLICATION_VERSION,
					title: this.title,
					plane: this.planes[this.player.plane].name,
					country: this.player.flight.country,
					briefing: this.briefing
				}, null, "\t"))

				fileStream.end()
			})

			fileStream.once("finish", resolve)
			fileStream.once("error", reject)
		})

		promise.then(() => {
			log.profile(profileName)
		})

		return promise
	}
}

// Mission file formats
Mission.FORMAT_TEXT = "text"
Mission.FORMAT_BINARY = "binary"

// Binary string data index table (used in saving .msnbin file)
class BinaryStringTable {

	/**
	 * Binary string table constructor.
	 *
	 * @param {number} maxDataLength Index table maximum data item size.
	 * @param {number} minItemsCount Index table minimum items count.
	 * @constructor
	 */
	constructor(maxDataLength, minItemsCount) {

		this.header = []
		this.data = []
		this.maxDataLength = maxDataLength
		this.minItemsCount = minItemsCount
	}

	/**
	 * Get string data index table value.
	 *
	 * @param {string} value String value to set in the index table.
	 * @returns {number} Index table address/index (16 bit unsigned integer).
	 */
	value(value) {

		// No index
		if (typeof value !== "string") {
			return 0xFFFF
		}

		let index = this.data.indexOf(value)

		// Add a new string item
		if (index < 0) {

			this.data.push(value)
			this.header.push(0)

			index = this.data.length - 1
		}

		// Update string usage (in the header of index table)
		this.header[index]++

		return index
	}

	/**
	 * Get a binary representation of string data index table.
	 *
	 * @returns {Buffer} Binary representation of string data index table.
	 */
	toBinary() {

		const dataLength = this.maxDataLength
		const itemsCount = Math.max(this.minItemsCount, this.data.length)
		let offset = 0
		let size = 6

		size += itemsCount * 2
		size += itemsCount * dataLength

		const buffer = new Buffer(size)

		// Max size of item
		buffer.writeUInt32LE(dataLength, offset)
		offset += 4

		// Number of items
		buffer.writeUInt16LE(itemsCount, offset)
		offset += 2

		// Header items
		for (let h = 0; h < itemsCount; h++) {

			const headerItem = this.header[h] || 0

			buffer.writeUInt16LE(headerItem, offset)
			offset += 2
		}

		// Data items
		for (let d = 0; d < itemsCount; d++) {

			const dataItem = this.data[d] || ""

			buffer.fill(0, offset, offset + dataLength)
			buffer.write(dataItem, offset)
			offset += dataLength
		}

		return buffer
	}
}

// Binary damage data index table (used in saving .msnbin file)
class BinaryDamageTable {

	constructor() {

		this.data = []
		this.dataIndex = Object.create(null)
		this.maxDamageValues = 0
	}

	/**
	 * Get damage data index table value.
	 *
	 * @param {Item} damageItem "Damaged" item to set in the index table.
	 * @returns {number} Index table address/index (16 bit unsigned integer).
	 */
	value(damageItem) {

		// Invalid arguments
		if (!(damageItem instanceof Item) || damageItem.type !== "Damaged") {
			throw new TypeError("Invalid damage item value.")
		}

		// TODO: Sort damage index values before JSON stringify
		const valueID = JSON.stringify(damageItem)
		let index = this.dataIndex[valueID]

		// Register a new unique damage value
		if (index === undefined) {

			const damageKeys = Object.keys(damageItem)

			this.maxDamageValues = Math.max(this.maxDamageValues, damageKeys.length)
			this.data.push(damageItem)

			index = this.dataIndex[valueID] = this.data.length - 1
		}

		return index
	}

	/**
	 * Get a binary representation of damage data index table.
	 *
	 * @returns {Buffer} Binary representation of damage data index table.
	 */
	toBinary() {

		const itemsCount = this.data.length
		let offset = 0
		let size = 6

		if (itemsCount > 0) {

			size += 4
			size += itemsCount * (1 + this.maxDamageValues * 2)
		}

		const buffer = new Buffer(size)

		// Max number of damage values
		buffer.writeUInt32LE(this.maxDamageValues, offset)
		offset += 4

		// Number of items
		buffer.writeUInt16LE(itemsCount, offset)
		offset += 2

		if (itemsCount > 0) {

			// Number of free/unused table items
			buffer.writeUInt32LE(0, offset)
			offset += 4

			// Write damage data items
			this.data.forEach(damageItem => {

				const damageKeys = Object.keys(damageItem)

				// Number of damage key items
				buffer.writeUInt8(damageKeys.length, offset)
				offset += 1

				// Write damage keys/values
				for (let k = 0; k < this.maxDamageValues; k++) {

					let damageKey = 0xFF
					let damageValue = 0

					// Use assigned damage key/value pair
					if (damageKeys.length) {

						damageKey = damageKeys.shift()
						damageValue = damageItem[damageKey]
					}

					if (damageValue >= 0 && damageValue <= 1) {

						// NOTE: Damage value in binary file is represented as a 8 bit
						// unsigned integer number with a range from 0 to 255.
						damageValue = Math.round(255 * damageValue)
					}
					else {
						damageValue = 0
					}

					buffer.writeUInt8(damageKey, offset)
					offset += 1

					buffer.writeUInt8(damageValue, offset)
					offset += 1
				}
			})
		}

		return buffer
	}
}
