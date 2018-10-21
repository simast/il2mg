import {SmartBuffer} from 'smart-buffer'

import {Country} from '../data/enums'
import {Item} from './Item'
import {DEFAULT_DAMAGE_REPORT, DEFAULT_COUNTRY, DEFAULT_BUFFER_SIZE} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32, writeString, writeFloat} from './utils'

// Vehicle AI level
export const enum VehicleAILevel {
	Player = 0,
	Low = 1,
	Normal = 2,
	High = 3
}

// Vehicle item
export class Vehicle extends Item {

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public readonly Country: Country = DEFAULT_COUNTRY
	public AILevel = VehicleAILevel.Normal
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
	protected *toBuffer(index: any, typeId?: number) {

		yield* super.toBuffer(index, typeId || BinaryType.Vehicle)

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE)

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// DamageThreshold
		writeUInt8(buffer, this.DamageThreshold)

		// DamageReport
		writeUInt32(buffer, this.DamageReport)

		// Script
		writeString(buffer, this.Script || '')

		// Country
		writeUInt32(buffer, this.Country)

		// AILevel
		writeUInt32(buffer, this.AILevel)

		// NumberInFormation
		writeUInt32(buffer, this.NumberInFormation || 0)

		// Vulnerable
		writeUInt8(buffer, this.Vulnerable)

		// Engageable
		writeUInt8(buffer, this.Engageable)

		// LimitAmmo
		writeUInt8(buffer, this.LimitAmmo)

		// Spotter
		writeUInt32(buffer, this.Spotter >= 0 ? this.Spotter : 0xFFFFFFFF)

		// BeaconChannel
		writeUInt32(buffer, this.BeaconChannel)

		// Callsign
		writeUInt8(buffer, this.Callsign)

		// DeleteAfterDeath
		writeUInt8(buffer, this.DeleteAfterDeath)

		// CoopStart
		writeUInt8(buffer, this.CoopStart || 0)

		// PayloadId
		writeUInt32(buffer, this.PayloadId)

		// WMMask
		writeUInt32(buffer, this.WMMask)

		// Fuel
		writeFloat(buffer, this.Fuel)

		// Callnum
		writeUInt8(buffer, this.Callnum)

		// RepairFriendlies
		writeUInt8(buffer, this.RepairFriendlies)

		// RearmFriendlies
		writeUInt8(buffer, this.RearmFriendlies)

		// RefuelFriendlies
		writeUInt8(buffer, this.RefuelFriendlies)

		// RepairTime
		writeUInt32(buffer, this.RepairTime)

		// RearmTime
		writeUInt32(buffer, this.RearmTime)

		// RefuelTime
		writeUInt32(buffer, this.RefuelTime)

		// MaintenanceRadius
		writeUInt32(buffer, this.MaintenanceRadius)

		yield buffer.toBuffer()
	}
}
