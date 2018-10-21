import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32} from './utils'

// Cover command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Cover command item
export default class MCU_CMD_Cover extends MCU {

	public CoverGroup: Bit = 1
	public Priority = PRIORITY_MEDIUM

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_Cover)

		const buffer = SmartBuffer.fromSize(5)

		// CoverGroup
		writeUInt8(buffer, this.CoverGroup)

		// Priority
		writeUInt32(buffer, this.Priority)

		yield buffer.toBuffer()
	}
}
