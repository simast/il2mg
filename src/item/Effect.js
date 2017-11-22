import Item from "../item"

// Effect item
export default class Effect extends Item {

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 10)

		let size = 8
		const scriptLength = Buffer.byteLength(this.Script)

		size += scriptLength

		const buffer = new Buffer(size)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// Script
		this.writeString(buffer, scriptLength, this.Script)

		yield buffer
	}
}