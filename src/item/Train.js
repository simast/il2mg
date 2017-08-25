/** @copyright Simas Toleikis, 2016 */

import Vehicle from "./Vehicle"

// Train item
export default class Train extends Vehicle {

	constructor() {
		super()

		// NOTE: Used in binary mission file but is missing from text file!
		delete this.NumberInFormation
		delete this.CoopStart
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 8)

		let size = 4
		const carriages = []

		// Build Carriages list
		if (Array.isArray(this.Carriages)) {

			for (let carriage of this.Carriages) {

				carriage = carriage.toString()

				carriages.push(carriage)
				size += 4 + Buffer.byteLength(carriage)
			}
		}

		const buffer = new Buffer(size)

		// Number of Carriages items
		this.writeUInt32(buffer, carriages.length)

		// Carriages list items
		carriages.forEach(carriage => {
			this.writeString(buffer, Buffer.byteLength(carriage), carriage)
		})

		yield buffer
	}
}