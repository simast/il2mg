import {SmartBuffer} from 'smart-buffer'

import {Country} from '../data/enums'
import {BinaryIndexTables} from '../mission/types'
import {Item} from './Item'
import {DEFAULT_DAMAGE_REPORT, DEFAULT_COUNTRY, DEFAULT_BUFFER_SIZE} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32, writeString, writeFloat} from './utils'

// Plane AI level
export const enum PlaneAILevel {
	Player = 0,
	Low = 1,
	Normal = 2,
	High = 3,
	Ace = 4
}

// Plane start state
export const enum PlaneStart {
	Air = 0,
	Runway = 1,
	Parking = 2
}

// Plane item
export class Plane extends Item {

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public readonly Country: Country = DEFAULT_COUNTRY
	public AILevel = PlaneAILevel.Normal
	public CoopStart: Bit = 0
	public NumberInFormation = 0
	public StartInAir = PlaneStart.Air
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
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.Plane)

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

		// CoopStart
		writeUInt8(buffer, this.CoopStart)

		// StartInAir
		writeUInt8(buffer, this.StartInAir)

		// Callsign
		writeUInt8(buffer, this.Callsign)

		// Callnum
		writeUInt8(buffer, this.Callnum)

		// NumberInFormation
		writeUInt32(buffer, this.NumberInFormation)

		// Time
		writeUInt32(buffer, this.Time)

		// Vulnerable
		writeUInt8(buffer, this.Vulnerable)

		// Engageable
		writeUInt8(buffer, this.Engageable)

		// LimitAmmo
		writeUInt8(buffer, this.LimitAmmo)

		// Spotter
		writeUInt32(buffer, this.Spotter >= 0 ? this.Spotter : 0xFFFFFFFF)

		// PayloadId
		writeUInt32(buffer, this.PayloadId)

		// WMMask
		writeUInt32(buffer, this.WMMask)

		// AiRTBDecision
		writeUInt8(buffer, this.AiRTBDecision)

		// DeleteAfterDeath
		writeUInt8(buffer, this.DeleteAfterDeath)

		// Fuel
		writeFloat(buffer, this.Fuel)

		yield buffer.toBuffer()
	}
}
