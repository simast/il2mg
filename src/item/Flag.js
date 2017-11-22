import Item, {DEFAULT_COUNTRY} from "../item"

// Flag item
export default class Flag extends Item {

	constructor() {
		super()

		this.StartHeight = 0
		this.SpeedFactor = 1
		this.BlockThreshold = 1
		this.Radius = 1
		this.Type = 0
		this.CountPlanes = 0
		this.CountVehicles = 0
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 13)

		let size = 38
		const scriptLength = Buffer.byteLength(this.Script)

		size += scriptLength

		const buffer = new Buffer(size)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// Country
		this.writeUInt32(buffer, this.Country || DEFAULT_COUNTRY)

		// StartHeight
		this.writeFloat(buffer, this.StartHeight)

		// SpeedFactor
		this.writeFloat(buffer, this.SpeedFactor)

		// BlockThreshold
		this.writeFloat(buffer, this.BlockThreshold)

		// Radius
		this.writeDouble(buffer, this.Radius)

		// Type
		this.writeUInt32(buffer, this.Type)

		// CountPlanes
		this.writeUInt8(buffer, this.CountPlanes)

		// CountVehicles
		this.writeUInt8(buffer, this.CountVehicles)

		// Script
		this.writeString(buffer, scriptLength, this.Script)

		yield buffer
	}
}