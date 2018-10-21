import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

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
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_CMD_AttackArea)

		const buffer = Buffer.allocUnsafe(19)

		// AttackArea
		this.writeDouble(buffer, this.AttackArea)

		// AttackGround
		this.writeUInt8(buffer, this.AttackGround)

		// AttackAir
		this.writeUInt8(buffer, this.AttackAir)

		// AttackGTargets
		this.writeUInt8(buffer, this.AttackGTargets)

		// Time
		this.writeUInt32(buffer, this.Time)

		// Priority
		this.writeUInt32(buffer, this.Priority)

		yield buffer
	}
}
