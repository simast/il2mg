import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType, Priority } from './enums';
import { Bit } from './types';
import { writeUInt32, writeUInt8 } from './utils';

// Force complete command item
export class MCU_CMD_ForceComplete extends MCU {
	public Priority = Priority.High;
	public EmergencyOrdnanceDrop: Bit = 0;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_CMD_ForceComplete);

		const buffer = SmartBuffer.fromSize(5);

		// Priority
		writeUInt32(buffer, this.Priority);

		// EmergencyOrdnanceDrop
		writeUInt8(buffer, this.EmergencyOrdnanceDrop);

		yield buffer.toBuffer();
	}
}
