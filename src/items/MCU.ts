import {SmartBuffer} from 'smart-buffer'

import {BinaryIndexTables} from '../mission/types'
import {DEFAULT_BUFFER_SIZE} from './constants'
import {Item} from './Item'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt8, writeUInt32, writeUInt32Array} from './utils'

// Base MCU item
export abstract class MCU extends Item {

	public Enabled?: Bit
	public readonly Targets: ReadonlyArray<number> = []
	public readonly Objects: ReadonlyArray<number> = []
	protected readonly EVENTS?: {[type: string]: number | undefined}
	protected readonly REPORTS?: {[type: string]: number | undefined}
	protected events?: MCU.OnEvents | null
	protected reports?: Item | null

	constructor() {
		super()

		// Events container item reference
		if (this.EVENTS) {
			Object.defineProperty(this, 'events', {value: null, writable: true})
		}

		// Reports container item reference
		if (this.REPORTS) {
			Object.defineProperty(this, 'reports', {value: null, writable: true})
		}
	}

	/**
	 * Add an event.
	 *
	 * @param type Event type name.
	 * @param target Target command item.
	 */
	public addEvent(type: string, target: MCU): void {

		// Validate event type
		if (typeof this.EVENTS !== 'object' || !(type in this.EVENTS)) {
			throw new Error('Invalid item event type.')
		}

		// Create a new events container child item
		if (!this.events) {

			this.events = new MCU.OnEvents()
			this.addItem(this.events)
		}

		// Add a new event item
		const eventItem = new MCU.OnEvents.OnEvent(this.EVENTS[type]!, target.Index!)

		// TODO: Ignore duplicate/existing events

		this.events.addItem(eventItem)
	}

	/**
	 * Add a report.
	 *
	 * @param type Report type name.
	 * @param command Source command item.
	 * @param target Target command item.
	 */
	public addReport(type: string, command: MCU, target: MCU): void {

		// Validate report type
		if (typeof this.REPORTS !== 'object' || !(type in this.REPORTS)) {
			throw new Error('Invalid item report type.')
		}

		// Create a new reports container child item
		if (!this.reports) {

			this.reports = new MCU.OnReports()
			this.addItem(this.reports)
		}

		// Add a new report item
		const reportItem = new MCU.OnReports.OnReport(this.REPORTS[type]!, command.Index!, target.Index!)

		// TODO: Ignore duplicate/existing reports

		this.reports.addItem(reportItem)
	}

	/**
	 * Write events list to the given buffer object.
	 *
	 * @param buffer Target SmartBuffer object.
	 */
	protected writeEvents(buffer: SmartBuffer): void {

		const {events} = this
		const eventItems = events
			&& events.items
			&& events.items.filter(
				(event): event is MCU.OnEvents.OnEvent => event instanceof MCU.OnEvents.OnEvent
			)
			|| []

		// Number of event items
		writeUInt32(buffer, eventItems.length)

		// List of OnEvent items
		eventItems.forEach(event => {

			writeUInt32(buffer, event.Type) // Event type
			writeUInt32(buffer, event.TarId) // Target command item ID
		})
	}

	/**
	 * Write reports list to the given buffer object.
	 *
	 * @param buffer Target SmartBuffer object.
	 */
	protected writeReports(buffer: SmartBuffer): void {

		const {reports} = this
		const reportItems = reports
			&& reports.items
			&& reports.items.filter(
				(report): report is MCU.OnReports.OnReport => report instanceof MCU.OnReports.OnReport
			)
			|| []

		// Number of report items
		writeUInt32(buffer, reportItems.length)

		// List of OnReport items
		reportItems.forEach(report => {

			writeUInt32(buffer, report.Type) // Report type
			writeUInt32(buffer, report.TarId) // Target command item ID
			writeUInt32(buffer, report.CmdId) // Source command item ID
		})
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @param typeId Binary item type ID.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables, typeId?: BinaryType): IterableIterator<Buffer> {

		yield* super.toBuffer(index, typeId)

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE)

		// Enabled
		writeUInt8(buffer, this.Enabled === undefined ? 1 : this.Enabled)

		// Targets list
		writeUInt32Array(buffer, this.Targets)

		// Objects list
		writeUInt32Array(buffer, this.Objects)

		yield buffer.toBuffer()
	}
}

export namespace MCU {

	// MCU -> OnEvents item
	export class OnEvents extends Item {

		constructor() {
			super('OnEvents')
		}
	}

	// MCU -> OnReports item
	export class OnReports extends Item {

		constructor() {
			super('OnReports')
		}
	}
}

export namespace MCU.OnEvents {

	// MCU -> OnEvents -> OnEvent item
	export class OnEvent extends Item {

		constructor(
			public Type: number,
			public TarId: number
		) {
			super('OnEvent')
		}
	}
}

export namespace MCU.OnReports {

	// MCU -> OnReports -> OnReport item
	export class OnReport extends Item {

		constructor(
			public Type: number,
			public CmdId: number,
			public TarId: number
		) {
			super('OnReport')
		}
	}
}
