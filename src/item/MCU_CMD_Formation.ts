import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {writeUInt32} from './utils'

// Formation command type constants
export const TYPE_PLANE_NONE = 0 // Plane: None
export const TYPE_PLANE_V = 1 // Plane: V-Form
export const TYPE_PLANE_EDGE_LEFT = 2 // Plane: Left Edge Form
export const TYPE_PLANE_EDGE_RIGHT = 3 // Plane: Right Edge Form
export const TYPE_VEHICLE_COLUMN_ROAD = 4 // Vehicle: On Road Column
export const TYPE_VEHICLE_COLUMN = 5 // Vehicle: Off Road Column
export const TYPE_VEHICLE_COLUMN_CUSTOM = 6 // Vehicle: Off Road User Formation
export const TYPE_VEHICLE_FORWARD = 7 // Vehicle: Forward
export const TYPE_VEHICLE_BACKWARD = 8 // Vehicle: Backward
export const TYPE_VEHICLE_STOP = 9 // Vehicle: Stop
export const TYPE_VEHICLE_STOP_PANIC = 10 // Vehicle: Panic Stop
export const TYPE_VEHICLE_STOP_DIRECTION = 12 // Vehicle: Set Direction and Stop
export const TYPE_VEHICLE_CONTINUE = 11 // Vehicle: Continue Moving

// Formation command density constants
export const DENSITY_DENSE = 0
export const DENSITY_SAFE = 1
export const DENSITY_LOOSE = 2

// Formation command item
export default class MCU_CMD_Formation extends MCU {

	public FormationType = TYPE_PLANE_NONE
	public FormationDensity = DENSITY_SAFE

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_Formation)

		const buffer = new SmartBuffer()

		// FormationType
		writeUInt32(buffer, this.FormationType)

		// FormationDensity
		writeUInt32(buffer, this.FormationDensity)

		yield buffer.toBuffer()
	}
}
