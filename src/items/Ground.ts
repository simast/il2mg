import {SmartBuffer} from 'smart-buffer'

import {BinaryIndexTables} from '../mission/types'
import {Item} from './Item'
import {DEFAULT_DAMAGE_REPORT} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt8} from './utils'

// Ground item
export class Ground extends Item {

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.Ground)

		const buffer = SmartBuffer.fromSize(9)

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// DamageThreshold
		writeUInt8(buffer, this.DamageThreshold)

		// DamageReport
		writeUInt32(buffer, this.DamageReport)

		yield buffer.toBuffer()
	}
}
