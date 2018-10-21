import {Country} from '../data/enums'
import {Item} from './item'
import {DEFAULT_COUNTRY} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'

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
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.Flag)

		let size = 38
		const script = this.Script || ''
		const scriptLength = Buffer.byteLength(script)

		size += scriptLength

		const buffer = Buffer.allocUnsafe(size)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// Country
		this.writeUInt32(buffer, this.Country)

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
		this.writeString(buffer, scriptLength, script)

		yield buffer
	}
}
