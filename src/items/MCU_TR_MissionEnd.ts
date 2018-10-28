import {SmartBuffer} from 'smart-buffer'

import {BinaryIndexTables} from '../mission/types'
import {MCU} from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8} from './utils'

// Mission End item
export class MCU_TR_MissionEnd extends MCU {

	public Enabled: Bit = 1
	public Succeeded: Bit = 1

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_TR_MissionEnd)

		const buffer = SmartBuffer.fromSize(1)

		// Succeeded
		writeUInt8(buffer, this.Succeeded)

		yield buffer.toBuffer()
	}
}
