import {SmartBuffer} from 'smart-buffer'

import {Country} from '../data/enums'
import {BinaryIndexTables} from '../mission/types'
import {Item} from './Item'
import {DEFAULT_COUNTRY, DEFAULT_DAMAGE_REPORT, DEFAULT_DURABILITY} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt8, writeUInt16} from './utils'

// Block item
export class Block extends Item {

	public DeleteAfterDeath: Bit = 0
	public DamageThreshold: Bit = 1
	public readonly Country: Country = DEFAULT_COUNTRY
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public Durability = DEFAULT_DURABILITY

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @param typeId Binary item type ID.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables, typeId?: BinaryType): IterableIterator<Buffer> {

		yield* super.toBuffer(index, typeId || BinaryType.Block)

		const buffer = SmartBuffer.fromSize(13)
		const {items = []} = this
		const damageItem = items.find((item): item is Block.Damaged => item instanceof Block.Damaged)

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// Flags
		let flags = 0

		// First bit is DeleteAfterDeath state
		if (this.DeleteAfterDeath) {
			flags |= 1 << 0
		}

		// Second bit is DamageThreshold state
		if (this.DamageThreshold) {
			flags |= 1 << 1
		}

		// Third bit is used to mark if "Damaged" table is available
		if (damageItem) {
			flags |= 1 << 2
		}

		writeUInt8(buffer, flags)

		// Country
		writeUInt16(buffer, this.Country)

		// DamageReport
		writeUInt8(buffer, this.DamageReport)

		// NOTE: Durability in binary file is represented as a 8 bit unsigned integer
		// number where the value is 1 point for every 500 normal durability points.
		writeUInt8(buffer, Math.round(this.Durability / 500))

		// Script string table index
		writeUInt16(buffer, index.script.registerValue(this.Script))

		// Damage data table index
		writeUInt16(buffer, index.damage.registerItem(damageItem))

		yield buffer.toBuffer()
	}
}

export namespace Block {

	// Block -> Damaged item
	export class Damaged extends Item {

		[damageIndex: number]: number | undefined

		constructor() {
			super('Damaged')
		}
	}
}
