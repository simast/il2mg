import {SmartBuffer} from 'smart-buffer'

import {Item} from './item'
import {DEFAULT_DAMAGE_REPORT} from './constants'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt8} from './utils'

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
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.Ground)

		const buffer = new SmartBuffer()

		// LinkTrId
		writeUInt32(buffer, this.LinkTrId || 0)

		// DamageThreshold
		writeUInt8(buffer, this.DamageThreshold)

		// DamageReport
		writeUInt32(buffer, this.DamageReport)

		yield buffer.toBuffer()
	}
}
