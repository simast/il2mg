import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {writeUInt32, writeDouble} from './utils'

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
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_Waypoint)

		const buffer = SmartBuffer.fromSize(20)

		// Area (m)
		writeDouble(buffer, this.Area)

		// Speed (km/h)
		writeDouble(buffer, this.Speed)

		// Priority
		writeUInt32(buffer, this.Priority)

		yield buffer.toBuffer()
	}
}
