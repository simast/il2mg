import {SmartBuffer} from 'smart-buffer'

import {Coalition} from '../data/enums'
import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32, writeUInt32Array} from './utils'

// Proximity item
export default class MCU_Proximity extends MCU {

	public Distance = 1000 // Meters
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

		yield* super.toBuffer(index, BinaryType.MCU_Proximity)

		const buffer = new SmartBuffer()

		// Distance
		writeUInt32(buffer, this.Distance)

		// Closer
		writeUInt8(buffer, this.Closer)

		// PlaneCoalitions
		writeUInt32Array(buffer, this.PlaneCoalitions || [])

		// VehicleCoalitions
		writeUInt32Array(buffer, this.VehicleCoalitions || [])

		yield buffer.toBuffer()
	}
}
