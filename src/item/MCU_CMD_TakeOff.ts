import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Take off command item
export default class MCU_CMD_TakeOff extends MCU {

	public NoTaxiTakeoff: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_CMD_TakeOff)

		const buffer = Buffer.allocUnsafe(4)

		// NoTaxiTakeoff
		this.writeUInt32(buffer, this.NoTaxiTakeoff)

		yield buffer
	}
}
