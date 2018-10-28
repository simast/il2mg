import {FileFormat} from './enums'
import {BinaryStringTable} from './BinaryStringTable'
import {BinaryDamageTable} from './BinaryDamageTable'

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
	name: BinaryStringTable
	desc: BinaryStringTable
	model: BinaryStringTable
	skin: BinaryStringTable
	script: BinaryStringTable
	damage: BinaryDamageTable
}
