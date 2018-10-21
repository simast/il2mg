import Vehicle from './Vehicle'
import {BinaryType} from './enums'

// Train item
export default class Train extends Vehicle {

	public Carriages?: string[]

	constructor() {
		super()

		// NOTE: Used in binary mission file but is missing from text file!
		delete this.NumberInFormation
		delete this.CoopStart
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.Train)

		let size = 4
		const carriages = []

		// Build Carriages list
		if (Array.isArray(this.Carriages)) {

			for (const carriage of this.Carriages) {

				carriages.push(carriage)
				size += 4 + Buffer.byteLength(carriage)
			}
		}

		const buffer = Buffer.allocUnsafe(size)

		// Number of Carriages items
		this.writeUInt32(buffer, carriages.length)

		// Carriages list items
		carriages.forEach(carriage => {
			this.writeString(buffer, Buffer.byteLength(carriage), carriage)
		})

		yield buffer
	}
}
