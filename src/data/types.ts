import {
	Country,
	VehicleType,
	TimePeriod,
	CallsignGroup,
	TaskType,
	AltitudeLevel,
	PlaneType,
	PlaneSize
} from './enums'

// data/items/item files
export type DataItem = {
	type: string // Item type
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
		[countryId in Country]: {
			// NOTE: Array contains weighted chances for each season (spring, summer,
			// autumn and winter). Negative values indicate player skin selection.
			[skinId: string]: [number, number, number, number]
		}
	}
}
