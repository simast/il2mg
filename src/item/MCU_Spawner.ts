import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8} from './utils'

// Spawner item
export default class MCU_Spawner extends MCU {

	public SpawnAtMe: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_Spawner)

		const buffer = SmartBuffer.fromSize(1)

		// SpawnAtMe
		writeUInt8(buffer, this.SpawnAtMe)

		yield buffer.toBuffer()
	}
}
