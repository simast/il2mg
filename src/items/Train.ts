import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { DEFAULT_BUFFER_SIZE } from './constants';
import { Vehicle } from './Vehicle';
import { BinaryType } from './enums';
import { writeUInt32, writeString } from './utils';

// Train item
export class Train extends Vehicle {
	public Carriages?: string[];

	constructor() {
		super();

		// NOTE: Used in binary mission file but is missing from text file and editor UI!
		delete this.NumberInFormation;
		delete this.CoopStart;
		delete this.PayloadId;
		delete this.WMMask;
		delete this.Fuel;
		delete this.Callnum;
		delete this.RepairFriendlies;
		delete this.RehealFriendlies;
		delete this.RearmFriendlies;
		delete this.RefuelFriendlies;
		delete this.RepairTime;
		delete this.RehealTime;
		delete this.RearmTime;
		delete this.RefuelTime;
		delete this.MaintenanceRadius;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.Train);

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE);
		const carriages = this.Carriages || [];

		// Number of Carriages items
		writeUInt32(buffer, carriages.length);

		// Carriages list items
		carriages.forEach(carriage => {
			writeString(buffer, carriage);
		});

		yield buffer.toBuffer();
	}
}
