import MCU from "./MCU"

// Land command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Land command item
export default class MCU_CMD_Land extends MCU {

	constructor() {
		super()

		this.Priority = PRIORITY_MEDIUM
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 16)

		const buffer = new Buffer(4)

		// Priority
		this.writeUInt32(buffer, this.Priority)

		yield buffer
	}
}
