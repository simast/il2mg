import Item, {DEFAULT_DAMAGE_REPORT, DEFAULT_COUNTRY} from "../item"

// Vehicle AI level constants
export const AI_PLAYER = 0
export const AI_LOW = 1
export const AI_NORMAL = 2
export const AI_HIGH = 3

// Vehicle item
export default class Vehicle extends Item {

	constructor() {
		super()

		this.DamageThreshold = 1
		this.DamageReport = DEFAULT_DAMAGE_REPORT
		this.Country = DEFAULT_COUNTRY
		this.AILevel = AI_NORMAL
		this.NumberInFormation = 0
		this.Vulnerable = 1
		this.Engageable = 1
		this.LimitAmmo = 1
		this.Spotter = -1
		this.BeaconChannel = 0
		this.Callsign = 0
		this.DeleteAfterDeath = 1
		this.CoopStart = 0
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @param {number} typeID Binary item type ID.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index, typeID) {

		yield* super.toBinary(index, typeID || 2)

		let size = 39
		const scriptLength = Buffer.byteLength(this.Script)

		size += scriptLength

		const buffer = new Buffer(size)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// DamageThreshold
		this.writeUInt8(buffer, this.DamageThreshold)

		// DamageReport
		this.writeUInt32(buffer, this.DamageReport)

		// Script
		this.writeString(buffer, scriptLength, this.Script)

		// Country
		this.writeUInt32(buffer, this.Country)

		// AILevel
		this.writeUInt32(buffer, this.AILevel)

		// NumberInFormation
		this.writeUInt32(buffer, this.NumberInFormation || 0)

		// Vulnerable
		this.writeUInt8(buffer, this.Vulnerable)

		// Engageable
		this.writeUInt8(buffer, this.Engageable)

		// LimitAmmo
		this.writeUInt8(buffer, this.LimitAmmo)

		// Spotter
		this.writeUInt32(buffer, this.Spotter >= 0 ? this.Spotter : 0xFFFFFFFF)

		// BeaconChannel
		this.writeUInt32(buffer, this.BeaconChannel)

		// Callsign
		this.writeUInt8(buffer, this.Callsign)

		// DeleteAfterDeath
		this.writeUInt8(buffer, this.DeleteAfterDeath)

		// CoopStart
		this.writeUInt8(buffer, this.CoopStart || 0)

		yield buffer
	}
}