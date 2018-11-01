import fs from 'fs'
import os from 'os'
import path from 'path'
import Random from 'random-js'

import {Immutable} from '../types'
import {data} from '../data'
import {CallsignGroup} from '../data/enums'
import {DataItem, DataCallsigns} from '../data/types'
import {APPLICATION_NAME, APPLICATION_VERSION} from '../constants'
import {log} from '../log'
import {Item, Group, Options} from '../items'
import {ItemType, ItemInstanceByType, getItemClassByType} from '../items/mappings'
import {FileFormat, FileExtension} from './enums'
import {Callsign, Params, DebugFeatures, BinaryIndexTables} from './types'
import {BinaryStringTable} from './BinaryStringTable'
import {BinaryDamageTable} from './BinaryDamageTable'

// Mission make parts
import makeBattle from './battle'
import makeChoice from './choice'
import makeDate from './date'
import makeMap from './map'
import makeBubble from './bubble'
import makeTime from './time'
import makePeople from './people'
import makePlanes from './planes'
import makeUnits from './units'
import makeVehicles from './vehicles'
import makeWeather from './weather'
import makeLocations from './locations'
import makeAirfields from './airfields'
import makeTasks from './tasks'
import makeFronts from './fronts'
import makeBlocks from './blocks'
import makeFormations from './formations'
import makeForces from './forces'
import makeBriefing from './briefing'

// List of mission parameters that make up the complex seed value
// NOTE: The order is important and is used to define parameter sequence
const complexSeedParams: string[] = [
	'seed', // Base seed value (numeric)
	'debug',
	'battle',
	'date',
	'time',
	'coalition',
	'country',
	'task',
	'pilot',
	'plane',
	'state',
	'airfield',
	'weather',
	'unit'
]

type ComplexSeed = {
	[paramIndex: number]: any
	[0]: number
}

export class Mission {

	private readonly items: Item[] = [] // Items list
	private readonly lang: string[] = [] // Language data
	private lastIndex = 0 // Last item index value

	// Used to track unique callsign selection
	private callsignPool: Partial<DataCallsigns> = {}

	// Mission parameters
	public readonly params: Immutable<Params>

	// List of delayed make callback functions
	public readonly make: Array<() => undefined> = []

	// Debug mode flags
	public readonly debug: boolean | Immutable<DebugFeatures>

	// Random number generator data
	public readonly rand: Random
	public readonly seed: number

	// FIXME:
	protected title: any
	protected planes: any
	protected player: any
	protected briefing: any

	/**
	 * Create a new mission.
	 *
	 * @param inputParams Desired mission parameters.
	 */
	constructor(inputParams: Immutable<Params>) {

		log.I('Making mission...')

		// Reserve an empty localization string (used in binary mission generation
		// for items without LCName or LCDesc properties).
		this.getLC('')

		const params = this.params = this.initParams(inputParams)
		const seed = this.seed = this.initSeed(params)
		this.rand = this.initRand(seed)

		// Debug mode
		this.debug = params.debug || false

		log.profile('Making')

		// Make mission parts
		// NOTE: Order is very important!
		makeBattle.call(this)
		makeChoice.call(this)
		makeDate.call(this)
		makeMap.call(this)
		makeBubble.call(this)
		makeTime.call(this)
		makePeople.call(this)
		makePlanes.call(this)
		makeUnits.call(this)
		makeVehicles.call(this)
		makeWeather.call(this)
		makeLocations.call(this)
		makeAirfields.call(this)
		makeTasks.call(this)
		makeFronts.call(this)
		makeBlocks.call(this)
		makeFormations.call(this)
		makeForces.call(this)
		makeBriefing.call(this)

		// Execute all delayed (last) mission make callbacks
		for (const makeCallback of this.make) {
			makeCallback()
		}

		log.profile('Making')
	}

	/**
	 * Test if seed is a complex seed value.
	 *
	 * @param seed Seed value to test.
	 * @returns Boolean indicating complex seed value status.
	 */
	private isComplexSeed(seed: string): boolean {

		// NOTE: Complex seed is not a number but a Base64 encoded string
		return !/^[0-9]+$/.test(seed)
	}

	/**
	 * Create complex seed value (if necessary).
	 *
	 * @param seed Simple (numeric) seed value.
	 * @param params Mission parameters.
	 * @returns Complex seed value or undefined when base numeric seed can be used.
	 */
	private createComplexSeed(seed: number, params: Immutable<Params>): string | undefined {

		const complexSeed: ComplexSeed = {
			[0]: seed
		}

		// Include all seed affecting parameters in a complex seed value
		for (let paramIndex = 1; paramIndex < complexSeedParams.length; paramIndex++) {

			const param = complexSeedParams[paramIndex]

			if (param in params) {
				complexSeed[paramIndex] = (params as any)[param]
			}
		}

		// Complex seed value not required, base numeric seed value can be used
		if (Object.keys(complexSeed).length <= 1) {
			return
		}

		// NOTE: Complex seed is a Base64-encoded JSON stringified object
		return Buffer.from(JSON.stringify(complexSeed), 'utf-8').toString('base64')
	}

	/**
	 * Extract mission params from complex seed value.
	 *
	 * @param seed Complex seed value.
	 * @returns Extracted mission parameters.
	 */
	private extractParamsFromComplexSeed(seed: string): Params {

		const params: Params = {}
		let complexSeed: ComplexSeed | undefined

		// Try to parse complex seed value (from Base64-encoded JSON string)
		try {
			complexSeed = JSON.parse(Buffer.from(seed, 'base64').toString('utf-8'))
		}
		catch {}

		if (typeof complexSeed === 'object') {

			// Restore parameters from complex seed value
			for (let paramIndex = 0; paramIndex < complexSeedParams.length; paramIndex++) {

				const param = complexSeedParams[paramIndex]

				if (paramIndex in complexSeed) {
					(params as any)[param] = complexSeed[paramIndex]
				}
			}
		}

		return params
	}

	/**
	 * Initialize final mission params (extracting from complex seed if necessary).
	 *
	 * @param inputParams Desired mission parameters.
	 * @returns Final set of mission parameters.
	 */
	private initParams(inputParams: Immutable<Params>): Params {

		const {seed} = inputParams
		const params: Params = {...inputParams}

		if (!seed || !this.isComplexSeed(seed)) {
			return params
		}

		// Restrict use of other parameters when complex seed is provided
		for (let i = 1; i < complexSeedParams.length; i++) {

			const param = complexSeedParams[i]

			if (param in params) {
				throw ['Cannot use "%s" parameter together with seed.', param]
			}
		}

		return {
			...params,
			...this.extractParamsFromComplexSeed(seed)
		}
	}

	/**
	 * Initialize random number generator seed value.
	 *
	 * @param params Mission parameters.
	 * @returns Numeric seed value.
	 */
	private initSeed(params: Immutable<Params>): number {

		let seed: number
		let complexSeed: string | undefined

		// Initialize from existing seed
		if (params.seed) {

			const seedNumber = parseInt(params.seed, 10)

			// Validate seed value
			if (isNaN(seedNumber) || seedNumber <= 0) {
				throw ['Invalid mission seed!', {seed: params.seed}]
			}

			seed = seedNumber
		}
		// Create a new seed
		else {

			// NOTE: Ignoring the first number from Date.now() to shorten the seed
			seed = Date.now() % 1000000000000

			// Create a complex seed value (if necessary)
			complexSeed = this.createComplexSeed(seed, params)
		}

		const seedParam = complexSeed || seed.toString()

		// Save seed param value as a localization string
		this.getLC(seedParam)

		// Log seed param value
		log.I('Seed:', seedParam)

		return seed
	}

	/**
	 * Initialize random number generator.
	 *
	 * @param seed Base numeric seed value.
	 * @returns Random number generator instance.
	 */
	private initRand(seed: number): Random {

		const mtRand = Random.engines.mt19937()

		mtRand.seed(seed)

		return new Random(mtRand)
	}

	/**
	 * Create a new mission item.
	 *
	 * @param itemType Item type as an object or name.
	 * @param parent Add to the mission (true) or parent item (object).
	 * @returns New item instance.
	 */
	public createItem<T extends ItemType>(
		itemType: T | DataItem<T>,
		parent?: boolean | Item | this
	): ItemInstanceByType[T] {

		let itemData: DataItem<T> | undefined

		// Item type as an object with meta data
		if (typeof itemType === 'object') {

			itemData = itemType
			itemType = itemData.type
		}

		// Add item to mission if parent is not specified
		if (parent !== false && !(parent instanceof Item)) {
			parent = this
		}

		const item = new (getItemClassByType(itemType))()

		if (item.hasIndex) {

			// Set unique item index
			Object.defineProperty(item, 'Index', {
				enumerable: true,
				value: ++this.lastIndex
			})
		}

		// Set item mission reference
		Object.defineProperty(item, 'mission', {
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
	 * @param item Item object.
	 */
	public addItem(item: Item): void {

		this.items.push(item)

		// Set item parent reference
		Object.defineProperty(item, 'parent', {
			value: this,
			configurable: true
		})
	}

	/**
	 * Get localized mission language code for a given string.
	 *
	 * @param text Text string.
	 * @returns Localized mission language code.
	 */
	public getLC(text: string): number {

		const {lang} = this
		let languageCode = lang.indexOf(text)

		if (languageCode < 0) {
			languageCode = lang.push(text) - 1
		}

		return languageCode
	}

	/**
	 * Get unique callsign.
	 *
	 * @param group Callsign group.
	 * @returns Unique callsign.
	 */
	public getCallsign(group: CallsignGroup): Callsign {

		const {callsignPool, rand} = this
		let callsigns = callsignPool[group]

		// Initialize/shuffle callsign list data
		if (!callsigns || !callsigns.length) {

			callsigns = callsignPool[group] = data.callsigns[group].slice()
			rand.shuffle(callsigns)
		}

		// Use next available callsign
		const callsign = callsigns.shift()

		if (!callsign) {
			throw new Error('No valid callsign value found.')
		}

		const [id, name] = callsign

		return {id, name}
	}

	/**
	 * Save mission files.
	 *
	 * @param fileName Mission file name.
	 * @returns Promise to be fulfilled when all mission files are saved.
	 */
	public async save(fileName: string): Promise<void> {

		const {params, debug, seed} = this
		const format = params.format || FileFormat.Binary
		const saveAllFormats: boolean = debug && !params.format
		const promises: Promise<void>[] = []

		log.I('Saving mission...')

		let fileDir = ''
		let fileBase: string | undefined

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
			fileBase = `${APPLICATION_NAME}-${seed}`
		}

		// Make specified directory path
		if (fileDir && !fs.existsSync(fileDir)) {
			fs.mkdirSync(fileDir)
		}

		fileName = path.join(fileDir, fileBase)

		// Save text format file
		if (format === FileFormat.Text || saveAllFormats) {
			promises.push(this.saveText(fileName))
		}

		// Save binary format file
		if (format === FileFormat.Binary || saveAllFormats) {
			promises.push(this.saveBinary(fileName))
		}

		// Save language files
		promises.push(this.saveLang(fileName))

		// Save metadata file
		if (params.meta) {
			promises.push(this.saveMeta(fileName))
		}

		await Promise.all(promises)
	}

	/**
	 * Save text .Mission file.
	 *
	 * @param fileName Mission file name (without extension).
	 * @returns Promise to be fulfilled when file is saved.
	 */
	private saveText(fileName: string): Promise<void> {

		const profileName = `Saving .${FileExtension.Text}`

		log.profile(profileName)

		const promise = new Promise<void>((resolve, reject) => {

			const fileStream = fs.createWriteStream(`${fileName}.${FileExtension.Text}`)

			// Write .Mission data
			fileStream.once('open', () => {

				// Required mission file header
				fileStream.write('# Mission File Version = 1.0;' + os.EOL)

				// Write mission items
				this.items.forEach(item => {
					fileStream.write(os.EOL + item.toString() + os.EOL)
				})

				// Required mission file footer
				fileStream.write(os.EOL + '# end of file')

				fileStream.end()
			})

			fileStream.once('finish', resolve)
			fileStream.once('error', reject)
		})

		promise.then(() => {
			log.profile(profileName)
		})

		return promise
	}

	/**
	 * Save binary .msnbin file.
	 *
	 * @param fileName Mission file name (without extension).
	 * @returns Promise to be fulfilled when file is saved.
	 */
	private saveBinary(fileName: string): Promise<void> {

		const profileName = `Saving .${FileExtension.Binary}`

		log.profile(profileName)

		const promise = new Promise<void>((resolve, reject) => {

			const optionsBuffers: Buffer[] = []
			const itemBuffers: Buffer[] = []
			let numItems = 0

			// Create binary data index tables
			const indexTables: BinaryIndexTables = {
				name: new BinaryStringTable(32, 100),
				desc: new BinaryStringTable(32, 100),
				model: new BinaryStringTable(64, 100),
				skin: new BinaryStringTable(128, 100),
				script: new BinaryStringTable(128, 100),
				damage: new BinaryDamageTable()
			}

			// Collect binary representation of all mission items
			;(function walkItems(items: Immutable<Item[]>) {

				items.forEach(item => {

					// Process group child items
					if (item instanceof Group) {

						if (item.items && item.items.length) {
							walkItems(item.items)
						}
					}
					// Get item binary representation (data buffers)
					else {

						for (const buffer of item.toBuffer(indexTables)) {

							// Collect Options item buffers
							if (item instanceof Options) {
								optionsBuffers.push(buffer)
							}
							// Process normal item buffers
							else if (buffer.length) {
								itemBuffers.push(buffer)
							}
						}

						// Process linked item entity
						if (item.entity) {

							for (const buffer of item.entity.toBuffer(indexTables)) {
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

			const fileStream = fs.createWriteStream(`${fileName}.${FileExtension.Binary}`)

			fileStream.once('open', () => {

				// Write Options item buffers (has to be the first one in the file)
				while (optionsBuffers.length) {
					fileStream.write(optionsBuffers.shift())
				}

				const indexTableNames = Object.keys(indexTables)
				const itlhBuffer = Buffer.allocUnsafe(7) // Index table list header buffer
				const bsBuffer = Buffer.allocUnsafe(4) // Item size buffer

				// Write index table list header (number of index tables + 3 unknown bytes)
				itlhBuffer.writeUInt32LE(indexTableNames.length, 0)
				itlhBuffer.fill(0, 4)
				fileStream.write(itlhBuffer)

				// Write index tables
				fileStream.write(indexTables.name.toBuffer())
				fileStream.write(indexTables.desc.toBuffer())
				fileStream.write(indexTables.model.toBuffer())
				fileStream.write(indexTables.skin.toBuffer())
				fileStream.write(indexTables.script.toBuffer())
				fileStream.write(indexTables.damage.toBuffer())

				// Write items size buffer
				bsBuffer.writeUInt32LE(numItems, 0)
				fileStream.write(bsBuffer)

				// Write item buffers
				while (itemBuffers.length) {
					fileStream.write(itemBuffers.shift())
				}

				fileStream.end()
			})

			fileStream.once('finish', resolve)
			fileStream.once('error', reject)
		})

		promise.then(() => {
			log.profile(profileName)
		})

		return promise
	}

	/**
	 * Save .eng and other localization files.
	 *
	 * @param fileName Mission file name (without extension).
	 * @returns Promise to be fulfilled when all language files are saved.
	 */
	private async saveLang(fileName: string): Promise<void> {

		const promises: Promise<void>[] = []
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

			const profileName = `Saving .${lang}`

			log.profile(profileName)

			const promise = new Promise<void>((resolve, reject) => {

				const fileStream = fs.createWriteStream(`${fileName}.${lang}`)

				fileStream.once('open', () => {

					// Write UCS2 little-endian BOM
					fileStream.write('FFFE', 'hex')

					// Write language data
					this.lang.forEach((value, index) => {
						fileStream.write(index + ':' + value + os.EOL, 'ucs2')
					})

					fileStream.end()
				})

				fileStream.once('finish', resolve)
				fileStream.once('error', reject)
			})

			promise.then(() => {
				log.profile(profileName)
			})

			promises.push(promise)
		})

		await Promise.all(promises)
	}

	/**
	 * Save metadata .il2mg file.
	 *
	 * @param fileName Mission file name (without extension).
	 * @returns Promise to be fulfilled when file is saved.
	 */
	private saveMeta(fileName: string): Promise<void> {

		const profileName = `Saving .${FileExtension.Meta}`

		log.profile(profileName)

		const promise = new Promise<void>((resolve, reject) => {

			const fileStream = fs.createWriteStream(`${fileName}.${FileExtension.Meta}`)

			// Write .il2mg data
			fileStream.once('open', () => {

				fileStream.write(JSON.stringify({
					version: APPLICATION_VERSION,
					title: this.title,
					plane: this.planes[this.player.plane].name,
					country: this.player.flight.country,
					briefing: this.briefing
				}, null, '\t'))

				fileStream.end()
			})

			fileStream.once('finish', resolve)
			fileStream.once('error', reject)
		})

		promise.then(() => {
			log.profile(profileName)
		})

		return promise
	}
}
