import {SmartBuffer} from 'smart-buffer'

import {MCU} from './MCU'
import {BinaryType, Priority} from './enums'
import {writeUInt32} from './utils'

// Land command item
export class MCU_CMD_Land extends MCU {

	public Priority = Priority.Medium

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
