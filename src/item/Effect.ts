import {SmartBuffer} from 'smart-buffer'

import {DEFAULT_BUFFER_SIZE} from './constants'
import {Item} from './item'
import {BinaryType} from './enums'
import {writeUInt32, writeString} from './utils'

// Effect item
export default class Effect extends Item {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.Effect)

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE)

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// Script
		writeString(buffer, this.Script || '')

		yield buffer.toBuffer()
	}
}
