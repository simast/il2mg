import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Counter item
export default class MCU_Counter extends MCU {

	public Counter = 1
	public Dropcount: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_Counter)

		const buffer = Buffer.allocUnsafe(5)

		// Counter
		this.writeUInt32(buffer, this.Counter)

		// Dropcount
		this.writeUInt8(buffer, this.Dropcount)

		yield buffer
	}
}
