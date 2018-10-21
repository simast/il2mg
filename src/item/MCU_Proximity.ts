import {Coalition} from '../data/enums'
import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

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
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_Proximity)

		let size = 13

		if (Array.isArray(this.PlaneCoalitions)) {
			size += this.PlaneCoalitions.length * 4
		}

		if (Array.isArray(this.VehicleCoalitions)) {
			size += this.VehicleCoalitions.length * 4
		}

		const buffer = Buffer.allocUnsafe(size)

		// Distance
		this.writeUInt32(buffer, this.Distance)

		// Closer
		this.writeUInt8(buffer, this.Closer)

		// PlaneCoalitions
		this.writeUInt32Array(buffer, this.PlaneCoalitions || [])

		// VehicleCoalitions
		this.writeUInt32Array(buffer, this.VehicleCoalitions || [])

		yield buffer
	}
}
