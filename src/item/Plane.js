import Item, {DEFAULT_DAMAGE_REPORT, DEFAULT_COUNTRY} from "../item"

// Plane AI level constants
export const AI_PLAYER = 0
export const AI_LOW = 1
export const AI_NORMAL = 2
export const AI_HIGH = 3
export const AI_ACE = 4

// Plane start state constants
export const START_AIR = 0
export const START_RUNWAY = 1
export const START_PARKING = 2

// Plane item
export default class Plane extends Item {

	constructor() {
		super()

		this.DamageThreshold = 1
		this.DamageReport = DEFAULT_DAMAGE_REPORT
		this.Country = DEFAULT_COUNTRY
		this.AILevel = AI_NORMAL
		this.CoopStart = 0
		this.NumberInFormation = 0
		this.StartInAir = START_AIR
		this.Callsign = 0
		this.Callnum = 0
		this.Time = 60
		this.Vulnerable = 1
		this.Engageable = 1
		this.LimitAmmo = 1
		this.Spotter = -1
		this.PayloadId = 0
		this.WMMask = 0
		this.AiRTBDecision = 1
		this.DeleteAfterDeath = 1
		this.Fuel = 1
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 3)

		let size = 54
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

		// CoopStart
		this.writeUInt8(buffer, this.CoopStart)

		// StartInAir
		this.writeUInt8(buffer, this.StartInAir)

		// Callsign
		this.writeUInt8(buffer, this.Callsign)

		// Callnum
		this.writeUInt8(buffer, this.Callnum)

		// NumberInFormation
		this.writeUInt32(buffer, this.NumberInFormation)

		// Time
		this.writeUInt32(buffer, this.Time)

		// Vulnerable
		this.writeUInt8(buffer, this.Vulnerable)

		// Engageable
		this.writeUInt8(buffer, this.Engageable)

		// LimitAmmo
		this.writeUInt8(buffer, this.LimitAmmo)

		// Spotter
		this.writeUInt32(buffer, this.Spotter >= 0 ? this.Spotter : 0xFFFFFFFF)

		// PayloadId
		this.writeUInt32(buffer, this.PayloadId)

		// WMMask
		this.writeUInt32(buffer, this.WMMask)

		// AiRTBDecision
		this.writeUInt8(buffer, this.AiRTBDecision)

		// DeleteAfterDeath
		this.writeUInt8(buffer, this.DeleteAfterDeath)

		// Fuel
		this.writeFloat(buffer, this.Fuel)

		yield buffer
	}
}
