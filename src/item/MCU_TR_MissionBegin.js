import MCU from "./MCU"

// Mission Begin item
export default class MCU_TR_MissionBegin extends MCU {

	constructor() {
		super()

		this.Enabled = 1
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {
		yield* super.toBinary(index, 28)
	}
}