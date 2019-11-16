import { BinaryIndexTables } from '../mission/types';
import { Block } from './Block';
import { BinaryType } from './enums';

// Bridge item
export class Bridge extends Block {
	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.Bridge);
	}
}
