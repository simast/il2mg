import {SmartBuffer} from 'smart-buffer'

import {MCU} from './MCU'
import {BinaryType} from './enums'
import {writeUInt32} from './utils'

// Formation type
export const enum FormationType {
	PlaneNone = 0, // Plane: None
	PlaneV = 1, // Plane: V-Form
	PlaneEdgeLeft = 2, // Plane: Left Edge Form
	PlaneEdgeRight = 3, // Plane: Right Edge Form
	VehicleColumnRoad = 4, // Vehicle: On Road Column
	VehicleColumn = 5, // Vehicle: Off Road Column
	VehicleColumnCustom = 6, // Vehicle: Off Road User Formation
	VehicleForward = 7, // Vehicle: Forward
	VehicleBackward = 8, // Vehicle: Backward
	VehicleStop = 9, // Vehicle: Stop
	VehicleStopPanic = 10, // Vehicle: Panic Stop
	VehicleStopDirection = 12, // Vehicle: Set Direction and Stop
	VehicleContinue = 11 // Vehicle: Continue Moving
}

// Formation density
export const enum FormationDensity {
	Dense = 0,
	Safe = 1,
	Loose = 2
}

// Formation command item
export class MCU_CMD_Formation extends MCU {

	public FormationType = FormationType.PlaneNone
	public FormationDensity = FormationDensity.Safe

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_Formation)

		const buffer = SmartBuffer.fromSize(8)

		// FormationType
		writeUInt32(buffer, this.FormationType)

		// FormationDensity
		writeUInt32(buffer, this.FormationDensity)

		yield buffer.toBuffer()
	}
}
