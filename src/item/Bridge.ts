import Block from './Block'
import {BinaryType} from './enums'

// Bridge item
export default class Bridge extends Block {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.Bridge)
	}
}
