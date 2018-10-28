import {SmartBuffer} from 'smart-buffer'

import {BinaryIndexTables} from '../mission/types'
import {MCU} from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8} from './utils'

// Spawner item
export class MCU_Spawner extends MCU {

	public SpawnAtMe: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_Spawner)

		const buffer = SmartBuffer.fromSize(1)

		// SpawnAtMe
		writeUInt8(buffer, this.SpawnAtMe)

		yield buffer.toBuffer()
	}
}
