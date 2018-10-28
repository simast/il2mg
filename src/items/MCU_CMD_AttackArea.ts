import {SmartBuffer} from 'smart-buffer'

import {BinaryIndexTables} from '../mission/types'
import {MCU} from './MCU'
import {BinaryType, Priority} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32, writeDouble} from './utils'

// Attack area command item
export class MCU_CMD_AttackArea extends MCU {

	public AttackGround: Bit = 0
	public AttackAir: Bit = 0
	public AttackGTargets: Bit = 0
	public AttackArea = 1000
	public Time = 600 // 10 minutes
	public Priority = Priority.Medium

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_CMD_AttackArea)

		const buffer = SmartBuffer.fromSize(19)

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
