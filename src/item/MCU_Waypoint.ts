import MCU from './MCU'
import {BinaryType} from './enums'

// Waypoint priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Waypoint item
export default class MCU_Waypoint extends MCU {

	public Area = 0
	public Speed = 0
	public Priority = PRIORITY_MEDIUM

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_Waypoint)

		const buffer = Buffer.allocUnsafe(20)

		// Area (m)
		this.writeDouble(buffer, this.Area)

		// Speed (km/h)
		this.writeDouble(buffer, this.Speed)

		// Priority
		this.writeUInt32(buffer, this.Priority)

		yield buffer
	}
}
