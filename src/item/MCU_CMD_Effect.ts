import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {writeUInt32} from './utils'

// Effect command action type constants
export const ACTION_START = 0
export const ACTION_STOP = 1

// Effect command item
export default class MCU_CMD_Effect extends MCU {

	public ActionType = ACTION_START

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_Effect)

		const buffer = SmartBuffer.fromSize(4)

		// ActionType
		writeUInt32(buffer, this.ActionType)

		yield buffer.toBuffer()
	}
}
