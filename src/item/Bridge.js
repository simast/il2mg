import Block from "./Block"

// Bridge item
export default class Bridge extends Block {

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