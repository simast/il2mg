import MCU from './MCU'
import {BinaryType} from './enums'

// Timer item
export default class MCU_Timer extends MCU {

	public Time = 0 // Seconds
	public Random = 100

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_Timer)

		const buffer = Buffer.allocUnsafe(9)

		// Time
		this.writeDouble(buffer, this.Time)

		// Random
		this.writeUInt8(buffer, this.Random)

		yield buffer
	}
}
