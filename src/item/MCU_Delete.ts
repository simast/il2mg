import MCU from './MCU'
import {BinaryType} from './enums'

// Delete item
export default class MCU_Delete extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {
		yield* super.toBinary(index, BinaryType.MCU_Delete)
	}
}
