import fs from 'fs'
import path from 'path'
import addLazyProperty from 'lazy-property'
import yaml from 'js-yaml'

import {
	DataItems,
	DataItem,
	DataLanguages,
	DataVehicles,
	DataClouds,
	DataTime,
	DataCallsigns
} from './types'

// Data directory index file key
const DATA_INDEX_FILE = 'index'

class Data {

	// Internal cache for data.load() function
	private dataCache: {
		[itemPath: string]: any
	} = Object.create(null)

	// Map of supported data formats/extensions and their parse functions
	private dataFormats: {
		[extension: string]: ((content: string) => any) | undefined
	} = Object.create(null)

	// Main data directory path
	private dataPath = 'data'

	// Common data access properties
	public readonly items!: DataItems
	public readonly languages!: DataLanguages
	public readonly vehicles!: DataVehicles
	public readonly clouds!: DataClouds
	public readonly time!: DataTime
	public readonly callsigns!: DataCallsigns
	public readonly tasks: any
	public readonly planes: any
	public readonly countries: any
	public readonly battles: any

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
		addLazyProperty(this, 'items', () => this.load<DataItems>(path.join('items', DATA_INDEX_FILE)) || [])
		addLazyProperty(this, 'languages', () => this.load<DataLanguages>('languages'))
		addLazyProperty(this, 'vehicles', () => this.load<DataVehicles>('vehicles'))
		addLazyProperty(this, 'clouds', () => this.load<DataClouds>('clouds'))
		addLazyProperty(this, 'time', () => this.load<DataTime>('time'))
		addLazyProperty(this, 'callsigns', () => this.load<DataCallsigns>('callsigns'))
		addLazyProperty(this, 'tasks', () => this.load('tasks'))

		// Load planes
		addLazyProperty(this, 'planes', () => {

			const planes = Object.create(null)
			const planeData = this.load<any>('planes')

			for (const planeGroup in planeData) {
				for (const planeId in planeData[planeGroup]) {
					planes[planeId] = planeData[planeGroup][planeId]
				}
			}

			return Object.freeze(planes)
		})

		// Load countries
		addLazyProperty(this, 'countries', () => {

			const countries = this.load<any>('countries')

			for (const countryId in countries) {

				const country = countries[countryId]
				const countryPath = path.join('countries', countryId)

				addLazyProperty(country, 'formations', () => (
					this.load(path.join(countryPath, 'formations'))
				))

				addLazyProperty(country, 'names', () => this.load(path.join(countryPath, 'names')))
				addLazyProperty(country, 'ranks', () => this.load(path.join(countryPath, 'ranks')))
			}

			return countries
		})

		// Load battles
		addLazyProperty(this, 'battles', () => {

			const battles = this.load<any>('battles')

			for (const battleId in battles) {

				const battle = battles[battleId]
				const battlePath = path.join('battles', battleId)

				addLazyProperty(battle, 'blocks', () => this.load(path.join(battlePath, 'blocks')))
				addLazyProperty(battle, 'locations', () => this.load(path.join(battlePath, 'locations')))
				addLazyProperty(battle, 'fronts', () => this.load(path.join(battlePath, 'fronts')))
				addLazyProperty(battle, 'map', () => this.load(path.join(battlePath, 'map')))
				addLazyProperty(battle, 'weather', () => this.load(path.join(battlePath, 'weather')))
				addLazyProperty(battle, 'airfields', () => this.load(path.join(battlePath, 'airfields')))
				addLazyProperty(battle, 'roles', () => this.load(path.join(battlePath, 'roles')))

				// Load battle unit data
				addLazyProperty(battle, 'units', () => {

					const units = Object.create(null)
					const unitsData = this.load<any>(path.join(battlePath, 'units'))

					for (let unitCountryKey in unitsData) {

						const countryId = parseInt(unitCountryKey, 10)

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

					return Object.freeze(units)
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
	load<T>(itemPath: string): T {

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

			numberTypeId = items.push(stringTypeId) - 1

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
	getItemType(itemTypeId: number | string): DataItem {

		// Look up string item type ID
		if (typeof itemTypeId === 'number') {
			itemTypeId = this.items[itemTypeId]
		}

		return this.load<DataItem>(path.join('items', itemTypeId))
	}
}

export default new Data()
