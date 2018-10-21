import {SmartBuffer} from 'smart-buffer'

import {Coalition} from '../data/enums'
import {DEFAULT_BUFFER_SIZE} from './constants'
import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32Array, writeDouble} from './utils'

// Check zone item
export default class MCU_CheckZone extends MCU {

	public Zone = 1000
	public Cylinder: Bit = 1
	public Closer: Bit = 1
	public PlaneCoalitions?: Coalition[]
	public VehicleCoalitions?: Coalition[]

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CheckZone)

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE)

		// Zone
		writeDouble(buffer, this.Zone)

		// Cylinder
		writeUInt8(buffer, this.Cylinder)

		// Closer
		writeUInt8(buffer, this.Closer)

		// PlaneCoalitions
		writeUInt32Array(buffer, this.PlaneCoalitions || [])

		// VehicleCoalitions
		writeUInt32Array(buffer, this.VehicleCoalitions || [])

		yield buffer.toBuffer()
	}
}
