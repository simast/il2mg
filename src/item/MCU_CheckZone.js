import MCU from "./MCU"

// Check zone item
export default class MCU_CheckZone extends MCU {

	constructor() {
		super()

		this.Zone = 1000
		this.Cylinder = 1
		this.Closer = 1
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 46)

		let size = 18

		if (Array.isArray(this.PlaneCoalitions)) {
			size += this.PlaneCoalitions.length * 4
		}

		if (Array.isArray(this.VehicleCoalitions)) {
			size += this.VehicleCoalitions.length * 4
		}

		const buffer = Buffer.allocUnsafe(size)

		// Zone
		this.writeDouble(buffer, this.Zone)

		// Cylinder
		this.writeUInt8(buffer, this.Cylinder)

		// Closer
		this.writeUInt8(buffer, this.Closer)

		// PlaneCoalitions
		this.writeUInt32Array(buffer, this.PlaneCoalitions || [])

		// VehicleCoalitions
		this.writeUInt32Array(buffer, this.VehicleCoalitions || [])

		yield buffer
	}
}
