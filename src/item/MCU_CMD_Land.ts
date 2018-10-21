import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {writeUInt32} from './utils'

// Land command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Land command item
export default class MCU_CMD_Land extends MCU {

	public Priority = PRIORITY_MEDIUM

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_Land)

		const buffer = SmartBuffer.fromSize(4)

		// Priority
		writeUInt32(buffer, this.Priority)

		yield buffer.toBuffer()
	}
}
