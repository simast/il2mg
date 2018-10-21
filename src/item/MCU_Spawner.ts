import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Spawner item
export default class MCU_Spawner extends MCU {

	public SpawnAtMe: Bit = 0

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_Spawner)

		const buffer = Buffer.allocUnsafe(1)

		// SpawnAtMe
		this.writeUInt8(buffer, this.SpawnAtMe)

		yield buffer
	}
}
