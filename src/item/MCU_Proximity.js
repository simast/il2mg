/** @copyright Simas Toleikis, 2016 */
"use strict"

const MCU = require("./MCU")

// Proximity item
module.exports = class MCU_Proximity extends MCU {

	constructor() {
		super()

		this.Distance = 1000
		this.Closer = 1
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 49)

		let size = 13

		if (Array.isArray(this.PlaneCoalitions)) {
			size += this.PlaneCoalitions.length * 4
		}

		if (Array.isArray(this.VehicleCoalitions)) {
			size += this.VehicleCoalitions.length * 4
		}

		const buffer = new Buffer(size)

		// Distance
		this.writeUInt32(buffer, this.Distance)

		// Closer
		this.writeUInt8(buffer, this.Closer)

		// PlaneCoalitions
		this.writeUInt32Array(buffer, this.PlaneCoalitions || [])

		// VehicleCoalitions
		this.writeUInt32Array(buffer, this.VehicleCoalitions || [])

		yield buffer
	}
}