import {SmartBuffer} from 'smart-buffer'

import {writeUInt32, writeUInt16} from '../items/utils'

// Binary string data index table (used while saving .msnbin file)
export class BinaryStringTable {

	private readonly header: number[] = []
	private readonly data: string[] = []

	/**
	 * Create a new binary string table instance.
	 *
	 * @param maxDataLength Index table maximum data item size.
	 * @param minItemsCount Index table minimum items count.
	 */
	constructor(
		private readonly maxDataLength: number,
		private readonly minItemsCount: number
	) {}

	/**
	 * Register string data index table value.
	 *
	 * @param value String value to set in the index table.
	 * @returns Index table address/index (16 bit unsigned integer).
	 */
	public registerValue(value?: string): number {

		// No index
		if (typeof value !== 'string') {
			return 0xFFFF
		}

		const {maxDataLength} = this

		// Restrict input value to maximum allowed data length
		if (Buffer.byteLength(value) > maxDataLength) {
			throw new Error('Value is too large.')
		}

		const {data, header} = this
		let index = data.indexOf(value)

		// Add a new string item
		if (index < 0) {

			data.push(value)
			header.push(0)

			index = data.length - 1
		}

		// Update string usage (in the header of index table)
		header[index]++

		return index
	}

	/**
	 * Get a binary representation of string data index table.
	 *
	 * @returns Binary string table data buffer.
	 */
	public toBuffer(): Buffer {

		const {maxDataLength, minItemsCount, data, header} = this
		const itemsCount = Math.max(minItemsCount, data.length)
		const emptyDataItemBuffer = Buffer.alloc(maxDataLength)

		const buffer = new SmartBuffer()

		// Max size of item
		writeUInt32(buffer, maxDataLength)

		// Number of items
		writeUInt16(buffer, itemsCount)

		// Header items
		for (let h = 0; h < itemsCount; h++) {
			writeUInt16(buffer, header[h] || 0)
		}

		// Data items
		for (let d = 0; d < itemsCount; d++) {

			const dataItem = data[d] || ''
			const {writeOffset} = buffer

			// Clear data item spot to zeros
			buffer.writeBuffer(emptyDataItemBuffer)

			if (dataItem) {
				buffer.writeString(dataItem, writeOffset)
			}
		}

		return buffer.toBuffer()
	}
}
