/** @copyright Simas Toleikis, 2015 */
"use strict"

const Block = require("./Block")

// Bridge item
module.exports = class Bridge extends Block {

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		yield* super.toBinary(index, 5)
	}
}