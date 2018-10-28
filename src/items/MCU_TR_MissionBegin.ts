import {BinaryIndexTables} from '../mission/types'
import {MCU} from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Mission Begin item
export class MCU_TR_MissionBegin extends MCU {

	public Enabled: Bit = 1

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_TR_MissionBegin)
	}
}
