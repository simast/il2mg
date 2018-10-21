import {MCU} from './MCU'
import {BinaryType} from './enums'

// Activate item
export class MCU_Activate extends MCU {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_Activate)
	}
}
