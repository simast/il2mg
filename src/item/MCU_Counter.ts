import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt8} from './utils'

// Counter item
export default class MCU_Counter extends MCU {

	public Counter = 1
	public Dropcount: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_Counter)

		const buffer = new SmartBuffer()

		// Counter
		writeUInt32(buffer, this.Counter)

		// Dropcount
		writeUInt8(buffer, this.Dropcount)

		yield buffer.toBuffer()
	}
}
