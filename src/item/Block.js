import Item, {
	DEFAULT_COUNTRY,
	DEFAULT_DAMAGE_REPORT,
	DEFAULT_DURABILITY
} from "../item"

// Block item
export default class Block extends Item {

	constructor() {
		super()

		this.DeleteAfterDeath = 0
		this.DamageThreshold = 1
		this.Country = DEFAULT_COUNTRY
		this.DamageReport = DEFAULT_DAMAGE_REPORT
		this.Durability = DEFAULT_DURABILITY
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @param {number} typeID Binary item type ID.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index, typeID) {

		yield* super.toBinary(index, typeID ? typeID : 1)

		const buffer = new Buffer(13)
		let damageItem

		// Find Damaged item
		if (this.items && this.items.length) {

			for (const item of this.items) {

				if (item.type === "Damaged") {

					damageItem = item
					break
				}
			}
		}

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// Flags
		let flags = 0

		// First bit is DeleteAfterDeath state
		if (this.DeleteAfterDeath) {
			flags |= 1 << 0
		}

		// Second bit is DamageThreshold state
		if (this.DamageThreshold) {
			flags |= 1 << 1
		}

		// Third bit is used to mark if "Damaged" table is available
		if (damageItem) {
			flags |= 1 << 2
		}

		this.writeUInt8(buffer, flags)

		// Country
		this.writeUInt16(buffer, this.Country)

		// DamageReport
		this.writeUInt8(buffer, this.DamageReport)

		// NOTE: Durability in binary file is represented as a 8 bit unsigned integer
		// number where the value is 1 point for every 500 normal durability points.
		this.writeUInt8(buffer, Math.round(this.Durability / 500))

		// Script string table index
		this.writeUInt16(buffer, index.script.value(this.Script))

		// Damage data table index
		this.writeUInt16(buffer, damageItem ? index.damage.value(damageItem) : 0xFFFF)

		yield buffer
	}
}