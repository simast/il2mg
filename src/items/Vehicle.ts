import {SmartBuffer} from 'smart-buffer'

import {Country} from '../data/enums'
import {BinaryIndexTables} from '../mission/types'
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

const DEFAULT_NUMBER_IN_FORMATION = 0
const DEFAULT_CALLNUM = 0
const DEFAULT_COOP_START = 0
const DEFAULT_PAYLOAD_ID = 0
const DEFAULT_WMMASK = 1
const DEFAULT_FUEL = 1
const DEFAULT_REPAIR_FRIENDLIES = 0
const DEFAULT_REHEAL_FRIENDLIES = 0
const DEFAULT_REARM_FRIENDLIES = 0
const DEFAULT_REFUEL_FRIENDLIES = 0
const DEFAULT_REPAIR_TIME = 0
const DEFAULT_REHEAL_TIME = 0
const DEFAULT_REARM_TIME = 0
const DEFAULT_REFUEL_TIME = 0
const DEFAULT_MAINTENANCE_RADIUS = 0

// Vehicle item
export class Vehicle extends Item {

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public readonly Country: Country = DEFAULT_COUNTRY
	public AILevel = VehicleAILevel.Normal
	public NumberInFormation? = DEFAULT_NUMBER_IN_FORMATION
	public Vulnerable: Bit = 1
	public Engageable: Bit = 1
	public LimitAmmo: Bit = 1
	public Spotter = -1
	public BeaconChannel = 0
	public Callsign = 0
	public Callnum? = DEFAULT_CALLNUM
	public DeleteAfterDeath: Bit = 1
	public CoopStart?: Bit = DEFAULT_COOP_START
	public PayloadId? = DEFAULT_PAYLOAD_ID
	public WMMask? = DEFAULT_WMMASK
	public Fuel? = DEFAULT_FUEL
	public RepairFriendlies?: Bit = DEFAULT_REPAIR_FRIENDLIES
	public RehealFriendlies?: Bit = DEFAULT_REHEAL_FRIENDLIES
	public RearmFriendlies?: Bit = DEFAULT_REARM_FRIENDLIES
	public RefuelFriendlies?: Bit = DEFAULT_REFUEL_FRIENDLIES
	public RepairTime? = DEFAULT_REPAIR_TIME
	public RehealTime? = DEFAULT_REHEAL_TIME
	public RearmTime? = DEFAULT_REARM_TIME
	public RefuelTime? = DEFAULT_REFUEL_TIME
	public MaintenanceRadius? = DEFAULT_MAINTENANCE_RADIUS

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @param typeId Binary item type ID.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables, typeId?: number) {

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
		writeUInt32(buffer, this.NumberInFormation || DEFAULT_NUMBER_IN_FORMATION)

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
		writeUInt8(buffer, this.CoopStart || DEFAULT_COOP_START)

		// PayloadId
		writeUInt32(buffer, this.PayloadId || DEFAULT_PAYLOAD_ID)

		// WMMask
		writeUInt32(buffer, this.WMMask || DEFAULT_WMMASK)

		// Fuel
		writeFloat(buffer, this.Fuel || DEFAULT_FUEL)

		// Callnum
		writeUInt8(buffer, this.Callnum || DEFAULT_CALLNUM)

		// RepairFriendlies
		writeUInt8(buffer, this.RepairFriendlies || DEFAULT_REPAIR_FRIENDLIES)

		// RehealFriendlies
		writeUInt8(buffer, this.RehealFriendlies || DEFAULT_REHEAL_FRIENDLIES)

		// RearmFriendlies
		writeUInt8(buffer, this.RearmFriendlies || DEFAULT_REARM_FRIENDLIES)

		// RefuelFriendlies
		writeUInt8(buffer, this.RefuelFriendlies || DEFAULT_REFUEL_FRIENDLIES)

		// RepairTime
		writeFloat(buffer, this.RepairTime || DEFAULT_REPAIR_TIME)

		// RehealTime
		writeFloat(buffer, this.RehealTime || DEFAULT_REHEAL_TIME)

		// RearmTime
		writeFloat(buffer, this.RearmTime || DEFAULT_REARM_TIME)

		// RefuelTime
		writeFloat(buffer, this.RefuelTime || DEFAULT_REFUEL_TIME)

		// MaintenanceRadius
		writeUInt32(buffer, this.MaintenanceRadius || DEFAULT_MAINTENANCE_RADIUS)

		yield buffer.toBuffer()
	}
}
