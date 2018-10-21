import MCU from './MCU'
import {Bit} from './types'
import {BinaryType} from './enums'

// Entity item
export default class MCU_TR_Entity extends MCU {

	public Enabled: Bit = 1
	public MisObjID?: number

	// Valid Entity event type name and ID constants
	get EVENTS() {
		return {
			OnPilotKilled: 0,
			OnPilotWounded: 1,
			OnPlaneCrashed: 2,
			OnPlaneCriticalDamage: 3,
			OnPlaneDestroyed: 4,
			OnPlaneLanded: 5,
			OnPlaneTookOff: 6,
			OnPlaneBingoFuel: 7,
			OnPlaneBingoMainMG: 8,
			OnPlaneBingoBombs: 9,
			OnPlaneBingoTurrets: 10,
			OnPlaneGunnersKilled: 11,
			OnDamaged: 12,
			OnKilled: 13,
			OnMovedTo: 15,
			OnPlaneSpawned: 20,
			OnOutOfPlanes: 21,
			OnPlaneAdded: 22,
			OnFlagBlocked: 23,
			OnFlagUnblocked: 24,
			OnFlagCapturedBy00: 25,
			OnFlagCapturedBy01: 26,
			OnFlagCapturedBy02: 27,
			OnFlagCapturedBy03: 28,
			OnFlagCapturedBy04: 29,
			OnFlagCapturedBy05: 30,
			OnFlagCapturedBy06: 31,
			OnFlagCapturedBy07: 32,
			OnFlagCapturedBy08: 33,
			OnFlagCapturedBy09: 34,
			OnFlagCapturedBy10: 35,
			OnFlagCapturedBy11: 36,
			OnFlagCapturedBy12: 37,
			OnFlagCapturedBy13: 38,
			OnFlagCapturedBy14: 39,
			OnFlagCapturedBy15: 40,
			OnFlagCapturedBy16: 41,
			OnSpottingStarted: 74
		}
	}

	// Valid Entity report type name and ID constants
	get REPORTS() {
		return {
			OnSpawned: 0,
			OnTargetAttacked: 1,
			OnAreaAttacked: 2,
			OnTookOff: 3,
			OnLanded: 4
		}
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_TR_Entity)

		const {events, reports} = this
		let size = 12

		if (events && events.items) {
			size += events.items.length * 8
		}

		if (reports && reports.items) {
			size += reports.items.length * 12
		}

		const buffer = Buffer.allocUnsafe(size)

		// Events list
		this.writeEvents(buffer)

		// MisObjID
		this.writeUInt32(buffer, this.MisObjID || 0)

		// Reports list
		this.writeReports(buffer)

		yield buffer
	}
}
