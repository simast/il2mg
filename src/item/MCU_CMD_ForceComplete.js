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
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 24)

		const buffer = new Buffer(4)

		// Priority
		this.writeUInt32(buffer, this.Priority)

		yield buffer
	}
}