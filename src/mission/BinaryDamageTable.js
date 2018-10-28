import {Item} from '../items'

// Binary damage data index table (used in saving .msnbin file)
export class BinaryDamageTable {

	constructor() {

		this.data = []
		this.dataIndex = Object.create(null)
		this.maxDamageValues = 0
	}

	/**
	 * Get damage data index table value.
	 *
	 * @param {Item} damageItem "Damaged" item to set in the index table.
	 * @returns {number} Index table address/index (16 bit unsigned integer).
	 */
	value(damageItem) {

		// Invalid arguments
		if (!(damageItem instanceof Item) || damageItem.type !== 'Damaged') {
			throw new TypeError('Invalid damage item value.')
		}

		// TODO: Sort damage index values before JSON stringify
		const valueID = JSON.stringify(damageItem)
		let index = this.dataIndex[valueID]

		// Register a new unique damage value
		if (index === undefined) {

			const damageKeys = Object.keys(damageItem)

			this.maxDamageValues = Math.max(this.maxDamageValues, damageKeys.length)
			this.data.push(damageItem)

			index = this.dataIndex[valueID] = this.data.length - 1
		}

		return index
	}

	/**
	 * Get a binary representation of damage data index table.
	 *
	 * @returns {Buffer} Binary representation of damage data index table.
	 */
	toBinary() {

		const itemsCount = this.data.length
		let offset = 0
		let size = 6

		if (itemsCount > 0) {

			size += 4
			size += itemsCount * (1 + (this.maxDamageValues * 2))
		}

		const buffer = Buffer.allocUnsafe(size)

		// Max number of damage values
		buffer.writeUInt32LE(this.maxDamageValues, offset)
		offset += 4

		// Number of items
		buffer.writeUInt16LE(itemsCount, offset)
		offset += 2

		if (itemsCount > 0) {

			// Number of free/unused table items
			buffer.writeUInt32LE(0, offset)
			offset += 4

			// Write damage data items
			this.data.forEach(damageItem => {

				const damageKeys = Object.keys(damageItem)

				// Number of damage key items
				buffer.writeUInt8(damageKeys.length, offset)
				offset += 1

				// Write damage keys/values
				for (let k = 0; k < this.maxDamageValues; k++) {

					let damageKey = 0xFF
					let damageValue = 0

					// Use assigned damage key/value pair
					if (damageKeys.length) {

						damageKey = damageKeys.shift()
						damageValue = damageItem[damageKey]
					}

					if (damageValue >= 0 && damageValue <= 1) {

						// NOTE: Damage value in binary file is represented as a 8 bit
						// unsigned integer number with a range from 0 to 255.
						damageValue = Math.round(255 * damageValue)
					}
					else {
						damageValue = 0
					}

					buffer.writeUInt8(damageKey, offset)
					offset += 1

					buffer.writeUInt8(damageValue, offset)
					offset += 1
				}
			})
		}

		return buffer
	}
}
