import MCU from "./MCU"

// Mission End item
export default class MCU_TR_MissionEnd extends MCU {

	constructor() {
		super()

		this.Enabled = 1
		this.Succeeded = 1
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 29)

		const buffer = new Buffer(1)

		// Succeeded
		this.writeUInt8(buffer, this.Succeeded)

		yield buffer
	}
}