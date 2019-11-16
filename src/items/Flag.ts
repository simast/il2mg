import { SmartBuffer } from 'smart-buffer';

import { Country } from '../data/enums';
import { BinaryIndexTables } from '../mission/types';
import { Item } from './Item';
import { DEFAULT_COUNTRY, DEFAULT_BUFFER_SIZE } from './constants';
import { BinaryType } from './enums';
import { Bit } from './types';
import {
	writeUInt32,
	writeUInt8,
	writeFloat,
	writeDouble,
	writeString,
} from './utils';

// Flag item
export class Flag extends Item {
	public StartHeight = 0;
	public SpeedFactor = 1;
	public BlockThreshold = 1;
	public Radius = 1;
	public Type = 0;
	public CountPlanes: Bit = 0;
	public CountVehicles: Bit = 0;
	public readonly Country: Country = DEFAULT_COUNTRY;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.Flag);

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE);

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId ?? 0);

		// Country
		writeUInt32(buffer, this.Country);

		// StartHeight
		writeFloat(buffer, this.StartHeight);

		// SpeedFactor
		writeFloat(buffer, this.SpeedFactor);

		// BlockThreshold
		writeFloat(buffer, this.BlockThreshold);

		// Radius
		writeDouble(buffer, this.Radius);

		// Type
		writeUInt32(buffer, this.Type);

		// CountPlanes
		writeUInt8(buffer, this.CountPlanes);

		// CountVehicles
		writeUInt8(buffer, this.CountVehicles);

		// Script
		writeString(buffer, this.Script ?? '');

		yield buffer.toBuffer();
	}
}
