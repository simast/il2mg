import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType } from './enums';
import { writeUInt8, writeDouble } from './utils';

// Timer item
export class MCU_Timer extends MCU {
	public Time = 0; // Seconds
	public Random = 100;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_Timer);

		const buffer = SmartBuffer.fromSize(9);

		// Time
		writeDouble(buffer, this.Time);

		// Random
		writeUInt8(buffer, this.Random);

		yield buffer.toBuffer();
	}
}