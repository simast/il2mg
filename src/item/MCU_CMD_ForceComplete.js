import MCU from "./MCU"

// Force complete command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Force complete command item
export default class MCU_CMD_ForceComplete extends MCU {

	constructor() {
		super()

		this.Priority = PRIORITY_HIGH
		this.EmergencyOrdnanceDrop = 0
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 24)

		const buffer = Buffer.allocUnsafe(5)

		// Priority
		this.writeUInt32(buffer, this.Priority)

		// EmergencyOrdnanceDrop
		this.writeUInt8(buffer, this.EmergencyOrdnanceDrop)

		yield buffer
	}
}
