import {SmartBuffer} from 'smart-buffer'

import {BinaryIndexTables} from '../mission/types'
import {DEFAULT_BUFFER_SIZE} from './constants'
import {Item} from './Item'
import {BinaryType} from './enums'
import {writeUInt32, writeString} from './utils'

// Effect item
export class Effect extends Item {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.Effect)

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE)

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// Script
		writeString(buffer, this.Script || '')

		yield buffer.toBuffer()
	}
}
