import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType, Priority } from './enums';
import { writeUInt32 } from './utils';

// Land command item
export class MCU_CMD_Land extends MCU {
	public Priority = Priority.Medium;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_CMD_Land);

		const buffer = SmartBuffer.fromSize(4);

		// Priority
		writeUInt32(buffer, this.Priority);

		yield buffer.toBuffer();
	}
}
