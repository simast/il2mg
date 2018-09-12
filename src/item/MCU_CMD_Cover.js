import MCU from "./MCU"

// Cover command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Cover command item
export default class MCU_CMD_Cover extends MCU {

	constructor() {
		super()

		this.CoverGroup = 1
		this.Priority = PRIORITY_MEDIUM
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 25)

		const buffer = new Buffer(5)

		// CoverGroup
		this.writeUInt8(buffer, this.CoverGroup)

		// Priority
		this.writeUInt32(buffer, this.Priority)

		yield buffer
	}
}
