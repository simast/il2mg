import {Item} from './item'
import {DEFAULT_COUNTRY, DEFAULT_DAMAGE_REPORT, DEFAULT_DURABILITY} from './constants'
import {BinaryType} from './enums'

// Block item
export default class Block extends Item {

	public DeleteAfterDeath = 0
	public DamageThreshold = 1
	protected Country = DEFAULT_COUNTRY
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public Durability = DEFAULT_DURABILITY

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @param typeId Binary item type ID.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any, typeId?: BinaryType): IterableIterator<Buffer> {

		yield* super.toBinary(index, typeId ? typeId : BinaryType.Block)

		const buffer = Buffer.allocUnsafe(13)
		const {items = []} = this
		const damageItem = items.find(({type}) => type === 'Damaged')

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
