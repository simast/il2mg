import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8} from './utils'

// Mission End item
export default class MCU_TR_MissionEnd extends MCU {

	public Enabled: Bit = 1
	public Succeeded: Bit = 1

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_TR_MissionEnd)

		const buffer = new SmartBuffer()

		// Succeeded
		writeUInt8(buffer, this.Succeeded)

		yield buffer.toBuffer()
	}
}
