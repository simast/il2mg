import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType, Priority } from './enums';
import { writeUInt32, writeDouble } from './utils';

// Waypoint item
export class MCU_Waypoint extends MCU {
	public Area = 0;
	public Speed = 0;
	public Priority = Priority.Medium;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_Waypoint);

		const buffer = SmartBuffer.fromSize(20);

		// Area (m)
		writeDouble(buffer, this.Area);

		// Speed (km/h)
		writeDouble(buffer, this.Speed);

		// Priority
		writeUInt32(buffer, this.Priority);

		yield buffer.toBuffer();
	}
}
