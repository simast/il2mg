import { SmartBuffer } from 'smart-buffer';

import { BinaryIndexTables } from '../mission/types';
import { MCU } from './MCU';
import { BinaryType } from './enums';
import { writeUInt32 } from './utils';

// Formation type
export const enum FormationType {
	PlaneNone = 0, // Plane: None
	PlaneV = 1, // Plane: V-Form
	PlaneEdgeLeft = 2, // Plane: Left Edge Form
	PlaneEdgeRight = 3, // Plane: Right Edge Form
	VehicleColumnRoad = 4, // Vehicle: On Road Column
	VehicleColumn = 5, // Vehicle: Off Road Column
	VehicleUser = 6, // Vehicle: Off Road User Formation
	VehicleForward = 7, // Vehicle: Forward
	VehicleBackward = 8, // Vehicle: Backward
	VehicleStop = 9, // Vehicle: Stop
	VehicleStopPanic = 10, // Vehicle: Panic Stop
	VehicleContinue = 11, // Vehicle: Continue Moving
	VehicleStopDirection = 12, // Vehicle: Set Direction and Stop
	VehicleUserReset = 13, // Vehicle: Reset Off Road User Formation
	VehicleUserLineLeft = 14, // Vehicle: User Formation Line Left
	VehicleUserLineRight = 15, // Vehicle: User Formation Line Right
	VehicleUserLineCenter = 16, // Vehicle: User Formation Line Center
	VehicleUserLineBack = 17, // Vehicle: User Formation Line Back
}

// Formation density
export const enum FormationDensity {
	Dense = 0,
	Safe = 1,
	Loose = 2,
}

// Formation command item
export class MCU_CMD_Formation extends MCU {
	public FormationType = FormationType.PlaneNone;
	public FormationDensity = FormationDensity.Safe;

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_CMD_Formation);

		const buffer = SmartBuffer.fromSize(8);

		// FormationType
		writeUInt32(buffer, this.FormationType);

		// FormationDensity
		writeUInt32(buffer, this.FormationDensity);

		yield buffer.toBuffer();
	}
}
