import MCU from "./MCU"

// Spawner item
export default class MCU_Spawner extends MCU {

	constructor() {
		super()

		this.SpawnAtMe = 0
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 48)

		const buffer = new Buffer(1)

		// SpawnAtMe
		this.writeUInt8(buffer, this.SpawnAtMe)

		yield buffer
	}
}
