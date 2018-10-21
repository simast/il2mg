import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Mission End item
export default class MCU_TR_MissionEnd extends MCU {

	public Enabled: Bit = 1
	public Succeeded: Bit = 1

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_TR_MissionEnd)

		const buffer = Buffer.allocUnsafe(1)

		// Succeeded
		this.writeUInt8(buffer, this.Succeeded)

		yield buffer
	}
}
