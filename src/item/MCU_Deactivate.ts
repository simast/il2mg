import MCU from './MCU'
import {BinaryType} from './enums'

// Deactivate item
export default class MCU_Deactivate extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {
		yield* super.toBinary(index, BinaryType.MCU_Deactivate)
	}
}
