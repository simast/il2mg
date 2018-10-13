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
