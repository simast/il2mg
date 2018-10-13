import {
	Country,
	VehicleType,
	TimePeriod,
	CallsignGroup,
	TaskType,
	AltitudeLevel,
	PlaneType
} from './enums'

// data/items/item files
export interface DataItem {
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

interface DataVehicle {
	name: string
	type: VehicleType[]
	countries: Country[]
	model: string
	script: string
	static?: string
}

// data/clouds file
export interface DataClouds {
	[cloudConfigId: string]: {
		altitude: number | [number, number] // Start altitude of cloud base layer
		thickness: number | [number, number] // Cloud layer thickness
		cover: number // Percentage of sky covered with clouds
		hasMist: boolean // Mist state
	}
}

// data/time file
export type DataTime = {
	[timePeriod in TimePeriod]: {
		description: string
		period?: number
	}
}

// data/callsigns file
export type DataCallsigns = {
	[callsignGroup in CallsignGroup]: [number, string][]
}

// data/tasks files
export type DataTasks = {
	[taskType in TaskType]: {
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
}
