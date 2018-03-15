import MCU from "./MCU"

// Waypoint priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Waypoint item
export default class MCU_Waypoint extends MCU {

	constructor() {
		super()

		this.Area = 0
		this.Speed = 0
		this.Priority = PRIORITY_MEDIUM
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 42)

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