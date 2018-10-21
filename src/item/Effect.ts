import {Item} from './item'
import {BinaryType} from './enums'

// Effect item
export default class Effect extends Item {

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.Effect)

		let size = 8
		const script = this.Script || ''
		const scriptLength = Buffer.byteLength(script)

		size += scriptLength

		const buffer = Buffer.allocUnsafe(size)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// Script
		this.writeString(buffer, scriptLength, script)

		yield buffer
	}
}
