import {MCU} from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Mission Begin item
export class MCU_TR_MissionBegin extends MCU {

	public Enabled: Bit = 1

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_TR_MissionBegin)
	}
}
