import {Item} from './item'
import {DEFAULT_DAMAGE_REPORT} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'

// Ground item
export default class Ground extends Item {

	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.Ground)

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
