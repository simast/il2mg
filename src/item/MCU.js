import Item from "../item"

// Event and report child item name constants
const ITEM_ON_EVENTS = "OnEvents"
const ITEM_ON_EVENT = "OnEvent"
const ITEM_ON_REPORTS = "OnReports"
const ITEM_ON_REPORT = "OnReport"

// Base MCU item
export default class MCU extends Item {

	constructor() {
		super()

		this.Targets = []
		this.Objects = []

		// Events container item reference
		if (this.EVENTS) {
			Object.defineProperty(this, "events", {value: null, writable: true})
		}

		// Reports container item reference
		if (this.REPORTS) {
			Object.defineProperty(this, "reports", {value: null, writable: true})
		}
	}

	/**
	 * Add an event.
	 *
	 * @param {string} type Event type name.
	 * @param {object} target Target command item.
	 */
	addEvent(type, target) {

		// Validate event type
		if (typeof this.EVENTS !== "object" || this.EVENTS[type] === undefined) {
			throw new Error("Invalid item event type.")
		}

		// Validate event target command item
		if (!(target instanceof MCU)) {
			throw new Error("Invalid event target command item.")
		}

		// Create a new events container child item
		if (!this.events) {

			this.events = new Item(ITEM_ON_EVENTS)
			this.addItem(this.events)
		}

		// Add a new event item
		const eventItem = new Item(ITEM_ON_EVENT)

		// TODO: Ignore duplicate/existing events

		eventItem.Type = this.EVENTS[type]
		eventItem.TarId = target.Index

		this.events.addItem(eventItem)
	}

	/**
	 * Add a report.
	 *
	 * @param {string} type Report type name.
	 * @param {object} command Source command item.
	 * @param {object} target Target command item.
	 */
	addReport(type, command, target) {

		// Validate report type
		if (typeof this.REPORTS !== "object" || this.REPORTS[type] === undefined) {
			throw new Error("Invalid item report type.")
		}

		// Validate report source and target command items
		if (!(command instanceof MCU) || !(target instanceof MCU)) {
			throw new Error("Invalid item report source or target command item.")
		}

		// Create a new reports container child item
		if (!this.reports) {

			this.reports = new Item(ITEM_ON_REPORTS)
			this.addItem(this.reports)
		}

		// Add a new report item
		const reportItem = new Item(ITEM_ON_REPORT)

		// TODO: Ignore duplicate/existing reports

		reportItem.Type = this.REPORTS[type]
		reportItem.CmdId = command.Index
		reportItem.TarId = target.Index

		this.reports.addItem(reportItem)
	}

	/**
	 * Write events list to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 */
	writeEvents(buffer) {

		let eventsCount = 0

		if (this.events) {
			eventsCount = this.events.items.length
		}

		// Number of event items
		this.writeUInt32(buffer, eventsCount)

		if (!this.events) {
			return
		}

		// List of OnEvent items
		this.events.items.forEach(event => {

			this.writeUInt32(buffer, event.Type) // Event type
			this.writeUInt32(buffer, event.TarId) // Target command item ID
		})
	}

	/**
	 * Write reports list to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 */
	writeReports(buffer) {

		let reportsCount = 0

		if (this.reports) {
			reportsCount = this.reports.items.length
		}

		// Number of report items
		this.writeUInt32(buffer, reportsCount)

		if (!this.reports) {
			return
		}

		// List of OnReport items
		this.reports.items.forEach(report => {

			this.writeUInt32(buffer, report.Type) // Report type
			this.writeUInt32(buffer, report.TarId) // Target command item ID
			this.writeUInt32(buffer, report.CmdId) // Source command item ID
		})
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @param {number} typeID Binary item type ID.
	 * @returns {Buffer} Binary representation of the item.
	 */
	*toBinary(index, typeID) {

		yield* super.toBinary(index, typeID)

		let size = 9

		if (Array.isArray(this.Targets)) {
			size += this.Targets.length * 4
		}

		if (Array.isArray(this.Objects)) {
			size += this.Objects.length * 4
		}

		const buffer = new Buffer(size)

		// Enabled
		this.writeUInt8(buffer, this.Enabled !== undefined ? this.Enabled : 1)

		// Targets list
		this.writeUInt32Array(buffer, this.Targets)

		// Objects list
		this.writeUInt32Array(buffer, this.Objects)

		yield buffer
	}
}