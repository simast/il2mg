import {SmartBuffer} from 'smart-buffer'

import {Immutable} from '../types'
import {Item} from '../items'
import {writeUInt32, writeUInt16, writeUInt8} from '../items/utils'

// Binary damage data index table (used while saving .msnbin file)
export class BinaryDamageTable {

	private readonly items: Immutable<Item>[] = []
	private readonly valueIndex: {[key: string]: number | undefined} = Object.create(null)
	private maxDamageValues = 0

	/**
	 * Register damage data index table item.
	 *
	 * @param item "Damaged" item to set in the index table.
	 * @returns Index table address/index (16 bit unsigned integer).
	 */
	public registerItem(item?: Immutable<Item>): number {

		// No index
		if (typeof item !== 'object') {
			return 0xFFFF
		}

		// Invalid item type
		if (item.type !== 'Damaged') {
			throw new TypeError('Invalid damage item value.')
		}

		const {valueIndex, items} = this

		// TODO: Sort damage index values before JSON stringify
		const valueId = JSON.stringify(item)
		let index = valueIndex[valueId]

		// Register a new unique damage value
		if (index === undefined) {

			this.maxDamageValues = Math.max(
				this.maxDamageValues,
				Object.keys(item).length
			)

			items.push(item)
			index = valueIndex[valueId] = items.length - 1
		}

		return index
	}

	/**
	 * Get a binary representation of damage data index table.
	 *
	 * @returns Damage index table data buffer.
	 */
	public toBuffer(): Buffer {

		const {maxDamageValues, items} = this
		const itemsCount = items.length
		const buffer = new SmartBuffer()

		// Max number of damage values
		writeUInt32(buffer, maxDamageValues)

		// Number of items
		writeUInt16(buffer, itemsCount)

		if (itemsCount > 0) {

			// Number of free/unused table items
			writeUInt32(buffer, 0)

			// Write damage data items
			items.forEach(damageItem => {

				const damageKeys = Object.keys(damageItem)

				// Number of damage key items
				writeUInt8(buffer, damageKeys.length)

				// Write damage keys/values
				for (let k = 0; k < maxDamageValues; k++) {

					const nextDamageKey = damageKeys.shift()
					let damageKey = 0xFF
					let damageValue = 0

					// Use assigned damage key/value pair
					if (nextDamageKey !== undefined) {

						damageKey = Number(nextDamageKey)
						damageValue = (damageItem as any)[nextDamageKey]
					}

					if (damageValue >= 0 && damageValue <= 1) {

						// NOTE: Damage value in a binary file is represented as a 8 bit
						// unsigned integer number with a range from 0 to 255.
						damageValue = Math.round(255 * damageValue)
					}
					else {
						damageValue = 0
					}

					writeUInt8(buffer, damageKey)
					writeUInt8(buffer, damageValue)
				}
			})
		}

		return buffer.toBuffer()
	}
}
