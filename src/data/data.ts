import fs from 'fs'
import path from 'path'
import addLazyProperty from 'lazy-property'
import yaml from 'js-yaml'

import {getEnumValues, Immutable, Mutable} from '../utils'
import {Country} from './enums'

import {
	DataItems,
	DataItem,
	DataLanguages,
	DataVehicles,
	DataClouds,
	DataTime,
	DataCallsigns,
	DataTasks,
	DataPlanes,
	DataCountries,
	DataCountryFormations,
	DataCountryNames,
	DataCountryRanks,
	DataBattles,
	DataBattleBlocks,
	DataBattleLocations,
	DataBattleFronts,
	DataBattleMap
} from './types'

// Data directory index file key
const DATA_INDEX_FILE = 'index'

type DataCache = {[itemPath: string]: any}
type DataFormats = {[extension: string]: ((content: string) => any) | undefined}

class Data {

	// Internal cache for data.load() function
	private dataCache: DataCache = Object.create(null)

	// Map of supported data formats/extensions and their parse functions
	private dataFormats: DataFormats = Object.create(null)

	// Main data directory path
	private dataPath = 'data'

	// Common data access properties
	public readonly items!: Immutable<DataItems>
	public readonly languages!: Immutable<DataLanguages>
	public readonly vehicles!: Immutable<DataVehicles>
	public readonly clouds!: Immutable<DataClouds>
	public readonly time!: Immutable<DataTime>
	public readonly callsigns!: Immutable<DataCallsigns>
	public readonly tasks!: Immutable<DataTasks>
	public readonly planes!: Immutable<DataPlanes>
	public readonly countries!: Immutable<DataCountries>
	public readonly battles!: Immutable<DataBattles>

	constructor() {

		// NOTE: For performance reasons YAML files are only used in development mode
		// (while in production build data files are loaded using native JSON support).
		if (process.env.NODE_ENV !== 'production') {
			this.dataFormats['.yaml'] = yaml.safeLoad
		}

		// Always enable JSON format
		this.dataFormats['.json'] = JSON.parse

		// Prepend app path when running as Electron application
		if ('electron' in process.versions) {
			this.dataPath = path.join(require('electron').app.getAppPath(), this.dataPath)
		}

		// Lazy load all static data
		addLazyProperty(this, 'languages', () => this.load<DataLanguages>('languages'))
		addLazyProperty(this, 'vehicles', () => this.load<DataVehicles>('vehicles'))
		addLazyProperty(this, 'clouds', () => this.load<DataClouds>('clouds'))
		addLazyProperty(this, 'time', () => this.load<DataTime>('time'))
		addLazyProperty(this, 'callsigns', () => this.load<DataCallsigns>('callsigns'))
		addLazyProperty(this, 'tasks', () => this.load<DataTasks>('tasks'))
		addLazyProperty(this, 'planes', () => this.load<DataPlanes>('planes'))

		addLazyProperty(this, 'items', () =>
			this.load<DataItems>(path.join('items', DATA_INDEX_FILE)) || [])

		// Load countries
		addLazyProperty(this, 'countries', () => {

			const countries = this.load<DataCountries>('countries')

			getEnumValues(Country).forEach(countryId => {

				const country = countries[countryId]
				const countryPath = path.join('countries', String(countryId))

				addLazyProperty(country, 'formations', () =>
					this.load<DataCountryFormations>(path.join(countryPath, 'formations')))

				addLazyProperty(country, 'names', () =>
					this.load<DataCountryNames>(path.join(countryPath, 'names')))

				addLazyProperty(country, 'ranks', () =>
					this.load<DataCountryRanks>(path.join(countryPath, 'ranks')))
			})

			return countries
		})

		// Load battles
		addLazyProperty(this, 'battles', () => {

			const battles = this.load<DataBattles>('battles')

			for (const battleId in battles) {

				const battle = battles[battleId]!
				const battlePath = path.join('battles', battleId)

				addLazyProperty(battle, 'blocks', () =>
					this.load<DataBattleBlocks>(path.join(battlePath, 'blocks')))

				addLazyProperty(battle, 'locations', () =>
					this.load<DataBattleLocations>(path.join(battlePath, 'locations')))

				addLazyProperty(battle, 'fronts', () =>
					this.load<DataBattleFronts>(path.join(battlePath, 'fronts')))

				addLazyProperty(battle, 'map', () =>
					this.load<DataBattleMap>(path.join(battlePath, 'map')))

				addLazyProperty(battle, 'weather', () => this.load(path.join(battlePath, 'weather')))
				addLazyProperty(battle, 'airfields', () => this.load(path.join(battlePath, 'airfields')))
				addLazyProperty(battle, 'roles', () => this.load(path.join(battlePath, 'roles')))

				// Load battle unit data
				addLazyProperty(battle, 'units', () => {

					const units = Object.create(null)
					const unitsData = this.load<any>(path.join(battlePath, 'units'))

					for (let unitCountryKey in unitsData) {

						const countryId = parseInt(unitCountryKey, 10) as Country

						// Ignore invalid country IDs
						if (isNaN(countryId) || !this.countries[countryId]) {
							continue
						}

						const unitsDataCountry = unitsData[countryId]

						// Build units list
						for (const unitGroup in unitsDataCountry) {
							for (const unitId in unitsDataCountry[unitGroup]) {

								units[unitId] = unitsDataCountry[unitGroup][unitId]
								units[unitId].country = countryId
							}
						}
					}

					return units
				})
			}

			return battles
		})
	}

	/**
	 * Load a data file from a given path.
	 *
	 * @param itemPath Data file path (relative to data directory).
	 * @returns Loaded data.
	 */
	load<T>(itemPath: string): Immutable<T> {

		if (!itemPath.length) {
			throw new TypeError('Invalid data file path.')
		}

		const {dataPath, dataCache, dataFormats} = this

		// Use cached data
		if (itemPath in dataCache) {
			return dataCache[itemPath]
		}

		const dataItemPath = path.join(dataPath, itemPath)
		let result: any

		// Try loading one of the supported data formats
		for (const extension in dataFormats) {

			const filePath = dataItemPath + extension

			if (fs.existsSync(filePath)) {

				result = Object.freeze(
					dataFormats[extension]!(fs.readFileSync(filePath, 'utf-8'))
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
	 * @param item Item data.
	 * @returns Item type ID.
	 */
	registerItemType(item: DataItem): number {

		if (typeof item !== 'object' || !item.type || !item.script || !item.model) {
			throw new TypeError('Invalid item data.')
		}

		const {items, dataPath, dataFormats} = this

		// Lowercase and trim script/model paths
		item.script = item.script.trim().toLowerCase()
		item.model = item.model.trim().toLowerCase()

		// Item type ID as a string (lowercase file name without extension)
		const stringTypeId = path.win32.basename(item.script, '.txt')

		// Try to find existing item type ID by script index
		let numberTypeId = items.indexOf(stringTypeId)

		// Add new item type
		if (numberTypeId === -1) {

			numberTypeId = (items as Mutable<typeof items>).push(stringTypeId) - 1

			const itemFile = path.join(dataPath, 'items', stringTypeId)
			const itemFileExists = Boolean(Object.keys(dataFormats).find(extension => (
				fs.existsSync(itemFile + extension)
			)))

			// Write item JSON file
			if (!itemFileExists) {

				fs.writeFileSync(
					itemFile + '.json',
					JSON.stringify(item, null, '\t')
				)
			}
		}

		return numberTypeId
	}

	/**
	 * Get item (world object) type data.
	 *
	 * @param itemTypeId Item type ID as numeric or string value.
	 * @returns Item type data.
	 */
	getItemType(itemTypeId: number | string): Immutable<DataItem> {

		// Look up string item type ID
		if (typeof itemTypeId === 'number') {
			itemTypeId = this.items[itemTypeId]
		}

		return this.load<DataItem>(path.join('items', itemTypeId))
	}
}

export default new Data()
