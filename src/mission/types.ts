import {FileFormat} from './enums'

export type Callsign = {
	id: number
	name: string
}

export type DebugFeatures = {
	airfields?: boolean
	front?: boolean
	flights?: boolean
}

export type Params = {
	debug?: boolean | DebugFeatures
	seed?: string
	format?: FileFormat
	meta?: boolean
	lang?: boolean | ReadonlyArray<string>
}

// Binary data index tables
export type BinaryIndexTables = {
	name: any
	desc: any
	model: any
	skin: any
	script: any
	damage: any
}
