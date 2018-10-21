import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt8} from './utils'

// Force complete command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Force complete command item
export default class MCU_CMD_ForceComplete extends MCU {

	public Priority = PRIORITY_HIGH
	public EmergencyOrdnanceDrop: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_ForceComplete)

		const buffer = SmartBuffer.fromSize(5)

		// Priority
		writeUInt32(buffer, this.Priority)

		// EmergencyOrdnanceDrop
		writeUInt8(buffer, this.EmergencyOrdnanceDrop)

		yield buffer.toBuffer()
	}
}
