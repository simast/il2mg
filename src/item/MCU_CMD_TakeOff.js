import MCU from "./MCU"

// Take off command item
export default class MCU_CMD_TakeOff extends MCU {

	constructor() {
		super()

		this.NoTaxiTakeoff = 0
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 15)

		const buffer = Buffer.allocUnsafe(4)

		// NoTaxiTakeoff
		this.writeUInt32(buffer, this.NoTaxiTakeoff)

		yield buffer
	}
}
