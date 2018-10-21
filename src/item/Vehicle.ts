import {Country} from '../data/enums'
import {Item} from './item'
import {DEFAULT_DAMAGE_REPORT, DEFAULT_COUNTRY} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'

// Vehicle AI level constants
export const AI_PLAYER = 0
export const AI_LOW = 1
export const AI_NORMAL = 2
export const AI_HIGH = 3

// Vehicle item
export default class Vehicle extends Item {

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public readonly Country: Country = DEFAULT_COUNTRY
	public AILevel = AI_NORMAL
	public NumberInFormation? = 0
	public Vulnerable: Bit = 1
	public Engageable: Bit = 1
	public LimitAmmo: Bit = 1
	public Spotter = -1
	public BeaconChannel = 0
	public Callsign = 0
	public Callnum = 0
	public DeleteAfterDeath: Bit = 1
	public CoopStart?: Bit = 0
	public PayloadId = 0
	public WMMask = 1
	public Fuel = 1
	public RepairFriendlies: Bit = 0
	public RearmFriendlies: Bit = 0
	public RefuelFriendlies: Bit = 0
	public RepairTime = 0
	public RearmTime = 0
	public RefuelTime = 0
	public MaintenanceRadius = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @param typeId Binary item type ID.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any, typeId?: number) {

		yield* super.toBinary(index, typeId || BinaryType.Vehicle)

		const script = this.Script || ''
		const scriptLength = Buffer.byteLength(script)
		let size = 71

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

		// PayloadId
		this.writeUInt32(buffer, this.PayloadId)

		// WMMask
		this.writeUInt32(buffer, this.WMMask)

		// Fuel
		this.writeFloat(buffer, this.Fuel)

		// Callnum
		this.writeUInt8(buffer, this.Callnum)

		// RepairFriendlies
		this.writeUInt8(buffer, this.RepairFriendlies)

		// RearmFriendlies
		this.writeUInt8(buffer, this.RearmFriendlies)

		// RefuelFriendlies
		this.writeUInt8(buffer, this.RefuelFriendlies)

		// RepairTime
		this.writeUInt32(buffer, this.RepairTime)

		// RearmTime
		this.writeUInt32(buffer, this.RearmTime)

		// RefuelTime
		this.writeUInt32(buffer, this.RefuelTime)

		// MaintenanceRadius
		this.writeUInt32(buffer, this.MaintenanceRadius)

		yield buffer
	}
}
