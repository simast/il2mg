import {Item} from './item'
import {DEFAULT_DAMAGE_REPORT, DEFAULT_COUNTRY} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'

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

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public Country = DEFAULT_COUNTRY
	public AILevel = AI_NORMAL
	public CoopStart: Bit = 0
	public NumberInFormation = 0
	public StartInAir = START_AIR
	public Callsign = 0
	public Callnum = 0
	public Time = 60
	public Vulnerable: Bit = 1
	public Engageable: Bit = 1
	public LimitAmmo: Bit = 1
	public Spotter = -1
	public PayloadId = 0
	public WMMask = 1
	public AiRTBDecision: Bit = 1
	public DeleteAfterDeath: Bit = 1
	public Fuel = 1

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.Plane)

		const script = this.Script || ''
		const scriptLength = Buffer.byteLength(script)
		let size = 54

		size += scriptLength

		const buffer = Buffer.allocUnsafe(size)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// DamageThreshold
		this.writeUInt8(buffer, this.DamageThreshold)

		// DamageReport
		this.writeUInt32(buffer, this.DamageReport)

		// Script
		this.writeString(buffer, scriptLength, script)

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
