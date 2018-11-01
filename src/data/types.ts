import {
	Coalition,
	Country,
	VehicleType,
	TimePeriod,
	CallsignGroup,
	TaskType,
	AltitudeLevel,
	PlaneType,
	PlaneSize,
	RankType,
	MapSeason
} from './enums'

import {DateValue} from './utils'

// data/items/item files
export type DataItem<T extends string = string> = {
	type: T // Item type
	script: string // Script path
	model: string // Model path
	durability?: number // Durability value
	damage?: number[] // Valid damage value index list
	time?: number // Effect time
	wreck?: boolean // Flag used to indicate that the item can be used as a wreck on airfields
	camo?: boolean // Flag used to indicate that the item model has visible camouflage
}

// data/items/index file
export type DataItems = string[]

// data/languages file
export type DataLanguages = string[]

// data/vehicles file
export type DataVehicles = DataVehicle[]

type DataVehicle = {
	name: string
	type: VehicleType[]
	countries: Country[]
	model: string
	script: string
	static?: string
}

// data/clouds file
export type DataClouds = {
	[cloudConfigId: string]: DataCloudsConfig
}

type DataCloudsConfig = {
	altitude: number | [number, number] // Start altitude of cloud base layer
	thickness: number | [number, number] // Cloud layer thickness
	cover: number // Percentage of sky covered with clouds
	hasMist: boolean // Mist state
}

// data/time file
export type DataTime = {
	[timePeriod in TimePeriod]: DataTimePeriod
}

type DataTimePeriod = {
	description: string
	period?: number
}

// data/callsigns file
export type DataCallsigns = {
	[callsignGroup in CallsignGroup]: DataCallsign[]
}

type DataCallsign = [number, string]

// data/tasks files
export type DataTasks = {
	[taskType in TaskType]: DataTask
}

type DataTask = {
	name: string
	title: string | {[storyId: string]: string}
	time: TimePeriod
	offmap?: boolean // Flag used to enable task for offmap airfields and flight routes
	local?: boolean // Flag used to indicate that this task is over local airfield
	rankMax?: number
	altitude?: {[altitudeLevel in AltitudeLevel]?: number}
	planes: {[planeType in PlaneType]?: number | string | string[]} // Plane type to formation map
	story: string[] | {[storyId: string]: string[]}
}

// data/planes files
export type DataPlanes = {
	[planeId: string]: DataPlane | string | null | undefined
}

type DataPlane = {
	name: string
	manufacturer?: string
	alias?: string
	size?: PlaneSize
	type?: PlaneType[]
	static?: string[]
	parent?: string
	speed?: number // Cruising speed at 0°C temperature and ~1.5 km altitude
	range?: number // Max range at cruising speed (km)
	skins?: {
		[countryId in Country]?: {
			// NOTE: Array contains weighted chances for each season (spring, summer,
			// autumn and winter). Negative values indicate player skin selection.
			[skinId: string]: [number, number, number, number] | undefined
		}
	}
}

// data/countries/index file
export type DataCountries = {
	[countryId in Country]: DataCountry
}

type DataCountry = {
	name: string
	demonym: string
	coalition: Coalition
	alias?: Country
	color: [number, number, number]
	formations: DataCountryFormations
	names: DataCountryNames
	ranks: DataCountryRanks
}

// data/countries/{countryId}/formations file
export type DataCountryFormations = {
	[formationId: string]: DataCountryFormation | undefined
}

type DataCountryFormation = {
	name?: string
	parent?: string
	hidden?: boolean
	from?: DateValue
	to?: DateValue
	elements?: number[] | string[]
}

// data/countries/{countryId}/names file
export type DataCountryNames = {
	[namePart: string]: DataCountryNameSubPart[] | undefined
}

type DataCountryNameSubPart = {
	[weight: number]: string[] | undefined
	total: number
}

// data/countries/{countryId}/ranks file
export type DataCountryRanks = {
	[rankId: number]: DataCountryRank | undefined
}

type DataCountryRank = {
	name: string
	abbr?: string
	type?: {
		[rankType in RankType]?: number
	}
}

// data/battles/index file
export type DataBattles = {
	[battleId: string]: DataBattle | undefined
}

type DataBattle = {
	name: string
	from: DateValue
	to: DateValue
	countries: Country[]
	blocks: DataBattleBlocks
	locations: DataBattleLocations
	fronts: DataBattleFronts
	map: DataBattleMap
	weather: DataBattleWeather
	airfields: DataBattleAirfields
	roles: DataBattleRoles
	units: DataBattleUnitsTransformed
}

// data/battles/{battleId}/blocks/index file
export type DataBattleBlocks = string[]

// data/battles/{battleId}/locations/index file
export type DataBattleLocations = string[]

// data/battles/{battleId}/fronts/index file
export type DataBattleFronts = {
	[date: string]: string | undefined // mission date => front file name
}

// data/battles/{battleId}/map file
export type DataBattleMap = {
	width: number // In meters
	height: number // In meters
	level: number // Average ground altitude above sea level
	latitude: number // Latitude for the map center midpoint
	longitude: number // Longitude for the map center midpoint
	utcOffset: 4 // Used for sun time computations
	season: {
		[season in MapSeason]?: DataBattleMapSeason
	}
}

type DataBattleMapSeason = {
	from: DateValue
	to: DateValue
	prefix: string
	heightmap: string
	textures: string
	forests: string
	gui: string
	clouds: string
}

// data/battles/{battleId}/weather file
export type DataBattleWeather = {
	[date: string]: DataBattleWeatherEntry | undefined
}

type DataBattleWeatherEntry = [
	number, // Min ~ temperature at sunrise (celcius)
	number, // Max ~ temperature 1 hour after solar noon (celcius)

	// Weather state/condition:
	// 1 - perfect, 2 - good, 3 - bad, 4 - extreme
	// (can be an array representing a from-to interval)
	number | [number, number]
]

// data/battles/{battleId}/airfields/index file
export type DataBattleAirfields = {
	[airfieldId: string]: DataBattleAirfield | undefined
}

type DataBattleAirfield = {
	name: string
	position: [number, number, number]
}

// data/battles/{battleId}/roles/* files
export type DataBattleRoles = {
	[countryId in Country]?: {
		[roleId: string]: DataBattleRole | undefined
	}
}

type DataBattleRole = {
	[taskType in TaskType]?: number
}

// data/battles/{battleId}/units/* files
export type DataBattleUnits = {
	[countryId in Country]?: {
		[unitGroupId: string]: {
			[unitId: string]: DataBattleUnit | undefined
		} | undefined
	}
}

type DataBattleUnit = {
	name?: string
	suffix?: string
	alias?: string
	parent?: string
	role?: string
	planesMin?: number
	planesMax?: number
	to?: DateValue
	from?: DateValue
	airfields?: [
		[string, DateValue?, DateValue?, number?]
	]
	planes?: [
		[string, number | [number, number], DateValue?, DateValue?]
	]
	pilots?: [
		[string, number, DateValue?, DateValue?]
	]
}

export type DataBattleUnitsTransformed = {
	[unitId: string]: DataBattleUnitTransformed | undefined
}

type DataBattleUnitTransformed = DataBattleUnit & {
	country: Country
}
