import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType } from './enums';

// Activate item
export class MCU_Activate extends MCU {
	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_Activate);
	}
}
