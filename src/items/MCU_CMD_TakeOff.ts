import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType } from './enums';
import { Bit } from './types';
import { writeUInt32 } from './utils';

// Take off command item
export class MCU_CMD_TakeOff extends MCU {
	public NoTaxiTakeoff: Bit = 0;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_CMD_TakeOff);

		const buffer = SmartBuffer.fromSize(4);

		// NoTaxiTakeoff
		writeUInt32(buffer, this.NoTaxiTakeoff);

		yield buffer.toBuffer();
	}
}
