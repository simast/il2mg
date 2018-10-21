import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32} from './utils'

// Take off command item
export default class MCU_CMD_TakeOff extends MCU {

	public NoTaxiTakeoff: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_TakeOff)

		const buffer = new SmartBuffer()

		// NoTaxiTakeoff
		writeUInt32(buffer, this.NoTaxiTakeoff)

		yield buffer.toBuffer()
	}
}
