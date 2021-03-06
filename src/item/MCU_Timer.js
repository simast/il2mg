import MCU from './MCU'

// Timer item
export default class MCU_Timer extends MCU {

	constructor() {
		super()

		this.Time = 0
		this.Random = 100
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 41)

		const buffer = Buffer.allocUnsafe(9)

		// Time
		this.writeDouble(buffer, this.Time)

		// Random
		this.writeUInt8(buffer, this.Random)

		yield buffer
	}
}
