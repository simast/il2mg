import fs from 'fs'
import path from 'path'
import addLazyProperty from 'lazy-property'
import yaml from 'js-yaml'

import {getEnumValues} from '../utils'
import {Immutable, Mutable} from '../types'
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
	DataBattleMap,
	DataBattleWeather,
	DataBattleAirfields,
	DataBattleRoles,
	DataBattleUnits,
	DataBattleUnitsTransformed
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

				addLazyProperty(battle, 'weather', () =>
					this.load<DataBattleWeather>(path.join(battlePath, 'weather')))

				addLazyProperty(battle, 'airfields', () =>
					this.load<DataBattleAirfields>(path.join(battlePath, 'airfields')))

				addLazyProperty(battle, 'roles', () =>
					this.load<DataBattleRoles>(path.join(battlePath, 'roles')))

				// Load battle unit data
				// FIXME: Here we should just load units as is and any transformations necessary
				// should be done in make/units.
				addLazyProperty(battle, 'units', () => {

					const units: DataBattleUnitsTransformed = Object.create(null)
					const unitsData = this.load<DataBattleUnits>(path.join(battlePath, 'units'))

					getEnumValues(Country).forEach(countryId => {

						const unitsDataCountry = unitsData[countryId]

						// Skip countries not active in battle
						if (!unitsDataCountry) {
							return
						}

						// Build units list
						for (const unitGroupId in unitsDataCountry) {

							const unitsDataGroup = unitsDataCountry[unitGroupId]!

							for (const unitId in unitsDataGroup) {

								units[unitId] = {
									...unitsDataGroup[unitId],
									country: countryId
								}
							}
						}
					})

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
	public load<T>(itemPath: string): Immutable<T> {

		const {dataCache} = this

		// Use cached data
		if (itemPath in dataCache) {
			return dataCache[itemPath]
		}

		const {dataPath, dataFormats} = this
		const dataItemPath = path.join(dataPath, itemPath)
		let result: any

		// Try loading one of the supported data formats
		for (const extension in dataFormats) {

			const filePath = dataItemPath + extension

			if (fs.existsSync(filePath)) {

				result = dataFormats[extension]!(fs.readFileSync(filePath, 'utf-8'))
				break
			}
		}

		// Check for data directory
		if (result === undefined && fs.existsSync(dataItemPath)
			&& fs.lstatSync(dataItemPath).isDirectory()) {

			// Try loading directory index data file
			result = this.load(path.join(itemPath, DATA_INDEX_FILE))

			if (result === undefined) {

				// Read all data files in a directory
				const directoryDataFiles = fs
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

				if (directoryDataFiles.length) {

					result = directoryDataFiles.reduce((result, fileKey) => ({
						...result,
						[fileKey]: this.load(path.join(itemPath, fileKey))
					}), {})
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
	 * @param itemData Item data.
	 * @returns Item type ID.
	 */
	public registerItemType(itemData: Immutable<DataItem>): number {

		const {items, dataPath, dataFormats} = this

		// Lowercase and trim script/model paths
		const script = itemData.script.trim().toLowerCase()
		const model = itemData.model.trim().toLowerCase()

		// Item type ID as a string (lowercase file name without extension)
		const stringTypeId = path.win32.basename(script, '.txt')

		// Try to find existing item type ID by script index
		let numberTypeId = items.indexOf(stringTypeId)

		// Add new item type
		if (numberTypeId === -1) {

			numberTypeId = (items as Mutable<typeof items>).push(stringTypeId) - 1

			const itemFile = path.join(dataPath, 'items', stringTypeId)
			const itemFileExists = Object.keys(dataFormats).some(extension => (
				fs.existsSync(itemFile + extension)
			))

			// Write item JSON file
			if (!itemFileExists) {

				fs.writeFileSync(
					itemFile + '.json',
					JSON.stringify({...itemData, script, model}, null, '\t')
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
	public getItemType(itemTypeId: number | string): Immutable<DataItem> {

		// Look up string item type ID
		if (typeof itemTypeId === 'number') {
			itemTypeId = this.items[itemTypeId]
		}

		return this.load<DataItem>(path.join('items', itemTypeId))
	}
}

export default new Data()
