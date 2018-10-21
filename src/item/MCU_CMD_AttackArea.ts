import {SmartBuffer} from 'smart-buffer'

import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32, writeDouble} from './utils'

// Attack area command priority constants
export const PRIORITY_LOW = 0
export const PRIORITY_MEDIUM = 1
export const PRIORITY_HIGH = 2

// Attack area command item
export default class MCU_CMD_AttackArea extends MCU {

	public AttackGround: Bit = 0
	public AttackAir: Bit = 0
	public AttackGTargets: Bit = 0
	public AttackArea = 1000
	public Time = 600 // 10 minutes
	public Priority = PRIORITY_MEDIUM

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_AttackArea)

		const buffer = new SmartBuffer()

		// AttackArea
		writeDouble(buffer, this.AttackArea)

		// AttackGround
		writeUInt8(buffer, this.AttackGround)

		// AttackAir
		writeUInt8(buffer, this.AttackAir)

		// AttackGTargets
		writeUInt8(buffer, this.AttackGTargets)

		// Time
		writeUInt32(buffer, this.Time)

		// Priority
		writeUInt32(buffer, this.Priority)

		yield buffer.toBuffer()
	}
}
