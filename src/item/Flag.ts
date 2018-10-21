import {SmartBuffer} from 'smart-buffer'

import {Country} from '../data/enums'
import {Item} from './item'
import {DEFAULT_COUNTRY} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt8, writeFloat, writeDouble, writeString} from './utils'

// Flag item
export default class Flag extends Item {

	public StartHeight = 0
	public SpeedFactor = 1
	public BlockThreshold = 1
	public Radius = 1
	public Type = 0
	public CountPlanes: Bit = 0
	public CountVehicles: Bit = 0
	public readonly Country: Country = DEFAULT_COUNTRY

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.Flag)

		const buffer = new SmartBuffer()

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// Country
		writeUInt32(buffer, this.Country)

		// StartHeight
		writeFloat(buffer, this.StartHeight)

		// SpeedFactor
		writeFloat(buffer, this.SpeedFactor)

		// BlockThreshold
		writeFloat(buffer, this.BlockThreshold)

		// Radius
		writeDouble(buffer, this.Radius)

		// Type
		writeUInt32(buffer, this.Type)

		// CountPlanes
		writeUInt8(buffer, this.CountPlanes)

		// CountVehicles
		writeUInt8(buffer, this.CountVehicles)

		// Script
		writeString(buffer, this.Script || '')

		yield buffer.toBuffer()
	}
}