import Item, {DEFAULT_DAMAGE_REPORT} from '../item'

// Ground item
export default class Ground extends Item {

	constructor() {
		super()

		this.DamageThreshold = 1
		this.DamageReport = DEFAULT_DAMAGE_REPORT
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index) {

		yield* super.toBinary(index, 7)

		const buffer = Buffer.allocUnsafe(9)

		// LinkTrId
		this.writeUInt32(buffer, this.LinkTrId || 0)

		// DamageThreshold
		this.writeUInt8(buffer, this.DamageThreshold)

		// DamageReport
		this.writeUInt32(buffer, this.DamageReport)

		yield buffer
	}
}
