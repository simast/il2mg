import MCU from "./MCU"

// Take off command item
export default class MCU_CMD_TakeOff extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		yield* super.toBinary(index, 15)
	}
}
