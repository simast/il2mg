import {Item} from './item'
import Block from './Block'
import {BinaryType} from './enums'
import {Bit} from './types'

// Airfield -> Chart -> Point item
class Point extends Item {

	constructor(
		public Type: number,
		public X: number,
		public Y: number
	) {
		super('Point')
	}
}

// Airfield -> Chart item
class Chart extends Item {

	static Point = Point

	constructor() {
		super('Chart')
	}
}

// Airfield item
export default class Airfield extends Block {

	public Callsign = 0
	public Callnum = 0
	public ReturnPlanes: Bit = 0
	public Hydrodrome: Bit = 0
	public RepairFriendlies: Bit = 0
	public RearmFriendlies: Bit = 0
	public RefuelFriendlies: Bit = 0
	public RepairTime = 0
	public RearmTime = 0
	public RefuelTime = 0
	public MaintenanceRadius = 0

	static Chart = Chart

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.Airfield)

		let size = 31
		const {items = []} = this

		// Find Chart item
		const chartItem = items.find(({type}) => type === 'Chart')

		// Find Chart->Point items
		const pointItems = chartItem && chartItem.items
			? chartItem.items.filter((item): item is Point => item.type === 'Point')
			: []

		size += pointItems.length * 20

		const buffer = Buffer.allocUnsafe(size)

		// ReturnPlanes
		this.writeUInt8(buffer, this.ReturnPlanes)

		// Hydrodrome
		this.writeUInt8(buffer, this.Hydrodrome)

		// Callsign
		this.writeUInt8(buffer, this.Callsign)

		// Callnum
		this.writeUInt8(buffer, this.Callnum)

		// RepairFriendlies
		this.writeUInt8(buffer, this.RepairFriendlies)

		// RearmFriendlies
		this.writeUInt8(buffer, this.RearmFriendlies)

		// RefuelFriendlies
		this.writeUInt8(buffer, this.RefuelFriendlies)

		// RepairTime
		this.writeUInt32(buffer, this.RepairTime)

		// RearmTime
		this.writeUInt32(buffer, this.RearmTime)

		// RefuelTime
		this.writeUInt32(buffer, this.RefuelTime)

		// MaintenanceRadius
		this.writeUInt32(buffer, this.MaintenanceRadius)

		// Unknown data (number of OnReports table items?)
		this.writeUInt32(buffer, 0)

		// Number of Chart->Point items
		this.writeUInt32(buffer, pointItems.length)

		// List of Point items
		for (const item of pointItems) {

			this.writeUInt32(buffer, item.Type) // Type
			this.writeDouble(buffer, item.X) // X
			this.writeDouble(buffer, item.Y) // Y
		}

		yield buffer
	}
}
