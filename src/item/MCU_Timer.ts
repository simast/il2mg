import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {writeUInt8, writeDouble} from './utils'

// Timer item
export default class MCU_Timer extends MCU {

	public Time = 0 // Seconds
	public Random = 100

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_Timer)

		const buffer = new SmartBuffer()

		// Time
		writeDouble(buffer, this.Time)

		// Random
		writeUInt8(buffer, this.Random)

		yield buffer.toBuffer()
	}
}
