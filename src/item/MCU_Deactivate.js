import MCU from './MCU'

// Deactivate item
export default class MCU_Deactivate extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		yield* super.toBinary(index, 45)
	}
}
