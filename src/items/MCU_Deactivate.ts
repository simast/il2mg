import {BinaryIndexTables} from '../mission/types'
import {MCU} from './MCU'
import {BinaryType} from './enums'

// Deactivate item
export class MCU_Deactivate extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_Deactivate)
	}
}
