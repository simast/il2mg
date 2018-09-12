import MCU from "./MCU"

// Effect command action type constants
export const ACTION_START = 0
export const ACTION_STOP = 1

// Effect command item
export default class MCU_CMD_Effect extends MCU {

	constructor() {
		super()

		this.ActionType = ACTION_START
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 26)

		const buffer = new Buffer(4)

		// ActionType
		this.writeUInt32(buffer, this.ActionType)

		yield buffer
	}
}
