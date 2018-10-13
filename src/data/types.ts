import {Country, Vehicle, Time, CallsignGroup} from './enums'

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
	type: Vehicle[]
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
	[time in Time]: {
		description: string
		period?: number
	}
}

// data/callsigns file
export type DataCallsigns = {
	[callsignGroup in CallsignGroup]: [number, string][]
}
