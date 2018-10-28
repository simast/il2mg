// Binary string data index table (used in saving .msnbin file)
export class BinaryStringTable {

	/**
	 * Binary string table constructor.
	 *
	 * @param {number} maxDataLength Index table maximum data item size.
	 * @param {number} minItemsCount Index table minimum items count.
	 * @constructor
	 */
	constructor(maxDataLength, minItemsCount) {

		this.header = []
		this.data = []
		this.maxDataLength = maxDataLength
		this.minItemsCount = minItemsCount
	}

	/**
	 * Get string data index table value.
	 *
	 * @param {string} value String value to set in the index table.
	 * @returns {number} Index table address/index (16 bit unsigned integer).
	 */
	value(value) {

		// No index
		if (typeof value !== 'string') {
			return 0xFFFF
		}

		let index = this.data.indexOf(value)

		// Add a new string item
		if (index < 0) {

			this.data.push(value)
			this.header.push(0)

			index = this.data.length - 1
		}

		// Update string usage (in the header of index table)
		this.header[index]++

		return index
	}

	/**
	 * Get a binary representation of string data index table.
	 *
	 * @returns {Buffer} Binary representation of string data index table.
	 */
	toBinary() {

		const dataLength = this.maxDataLength
		const itemsCount = Math.max(this.minItemsCount, this.data.length)
		let offset = 0
		let size = 6

		size += itemsCount * 2
		size += itemsCount * dataLength

		const buffer = Buffer.allocUnsafe(size)

		// Max size of item
		buffer.writeUInt32LE(dataLength, offset)
		offset += 4

		// Number of items
		buffer.writeUInt16LE(itemsCount, offset)
		offset += 2

		// Header items
		for (let h = 0; h < itemsCount; h++) {

			const headerItem = this.header[h] || 0

			buffer.writeUInt16LE(headerItem, offset)
			offset += 2
		}

		// Data items
		for (let d = 0; d < itemsCount; d++) {

			const dataItem = this.data[d] || ''

			buffer.fill(0, offset, offset + dataLength)
			buffer.write(dataItem, offset)
			offset += dataLength
		}

		return buffer
	}
}
