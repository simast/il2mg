/** @copyright Simas Toleikis, 2015 */

import MCU from "./MCU"

// Delete item
export default class MCU_Delete extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		yield* super.toBinary(index, 50)
	}
}