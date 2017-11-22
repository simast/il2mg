import MCU from "./MCU"

// Activate item
export default class MCU_Activate extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		yield* super.toBinary(index, 44)
	}
}