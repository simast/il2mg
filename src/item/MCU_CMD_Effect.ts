import MCU from './MCU'
import {BinaryType} from './enums'

// Effect command action type constants
export const ACTION_START = 0
export const ACTION_STOP = 1

// Effect command item
export default class MCU_CMD_Effect extends MCU {

	public ActionType = ACTION_START

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_CMD_Effect)

		const buffer = Buffer.allocUnsafe(4)

		// ActionType
		this.writeUInt32(buffer, this.ActionType)

		yield buffer
	}
}
