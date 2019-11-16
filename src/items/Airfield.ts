import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { DEFAULT_BUFFER_SIZE } from './constants';
import { Item } from './Item';
import { Block } from './Block';
import { BinaryType } from './enums';
import { Bit } from './types';
import { writeUInt32, writeUInt8, writeDouble, writeFloat } from './utils';

// Airfield item
export class Airfield extends Block {
	public Callsign = 0;
	public Callnum = 0;
	public ReturnPlanes: Bit = 0;
	public Hydrodrome: Bit = 0;
	public RepairFriendlies: Bit = 0;
	public RehealFriendlies: Bit = 0;
	public RearmFriendlies: Bit = 0;
	public RefuelFriendlies: Bit = 0;
	public RepairTime = 0;
	public RehealTime = 0;
	public RearmTime = 0;
	public RefuelTime = 0;
	public MaintenanceRadius = 0;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.Airfield);

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE);
		const { items = [] } = this;

		// Find Chart item
		const chartItem = items.find(
			(item): item is Airfield.Chart => item instanceof Airfield.Chart,
		);

		// Find Chart->Point items
		const pointItems =
			chartItem && chartItem.items
				? chartItem.items.filter(
						(item): item is Airfield.Chart.Point =>
							item instanceof Airfield.Chart.Point,
				  )
				: [];

		// ReturnPlanes
		writeUInt8(buffer, this.ReturnPlanes);

		// Hydrodrome
		writeUInt8(buffer, this.Hydrodrome);

		// Callsign
		writeUInt8(buffer, this.Callsign);

		// Callnum
		writeUInt8(buffer, this.Callnum);

		// RepairFriendlies
		writeUInt8(buffer, this.RepairFriendlies);

		// RehealFriendlies
		writeUInt8(buffer, this.RehealFriendlies);

		// RearmFriendlies
		writeUInt8(buffer, this.RearmFriendlies);

		// RefuelFriendlies
		writeUInt8(buffer, this.RefuelFriendlies);

		// RepairTime
		writeFloat(buffer, this.RepairTime);

		// RehealTime
		writeFloat(buffer, this.RehealTime);

		// RearmTime
		writeFloat(buffer, this.RearmTime);

		// RefuelTime
		writeFloat(buffer, this.RefuelTime);

		// MaintenanceRadius
		writeUInt32(buffer, this.MaintenanceRadius);

		// Unknown data (number of OnReports table items?)
		writeUInt32(buffer, 0);

		// Number of Chart->Point items
		writeUInt32(buffer, pointItems.length);

		// List of Point items
		for (const item of pointItems) {
			writeUInt32(buffer, item.Type); // Type
			writeDouble(buffer, item.X); // X
			writeDouble(buffer, item.Y); // Y
		}

		yield buffer.toBuffer();
	}
}

// eslint-disable-next-line no-redeclare
export namespace Airfield {
	// Airfield -> Chart item
	export class Chart extends Item {}
}

// eslint-disable-next-line no-redeclare
export namespace Airfield.Chart {
	// Airfield -> Chart -> Point item
	export class Point extends Item {
		constructor(public Type: number, public X: number, public Y: number) {
			super();
		}
	}
}
