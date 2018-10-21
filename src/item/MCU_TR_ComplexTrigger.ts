import data from '../data'
import {Mutable} from '../types'
import {Country} from '../data/enums'
import {DEFAULT_DAMAGE_REPORT} from './constants'
import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'

// Complex Trigger event filters (with order representing bit number in binary file)
const eventFilters = [
	'EventsFilterSpawned',
	'EventsFilterEnteredSimple',
	'EventsFilterEnteredAlive',
	'EventsFilterLeftSimple',
	'EventsFilterLeftAlive',
	'EventsFilterFinishedSimple',
	'EventsFilterFinishedAlive',
	'EventsFilterStationaryAndAlive',
	'EventsFilterFinishedStationaryAndAlive',
	'EventsFilterTookOff',
	'EventsFilterDamaged',
	'EventsFilterCriticallyDamaged',
	'EventsFilterRepaired',
	'EventsFilterKilled',
	'EventsFilterDropedBombs',
	'EventsFilterFiredFlare',
	'EventsFilterFiredRockets',
	'EventsFilterDroppedCargoContainers',
	'EventsFilterDeliveredCargo',
	'EventsFilterParatrooperJumped',
	'EventsFilterParatrooperLandedAlive'
]

// Complex Trigger item
export default class MCU_TR_ComplexTrigger extends MCU {

	public Enabled: Bit = 1
	public Cylinder: Bit = 1
	public Radius = 1000 // Meters
	public DamageThreshold: Bit = 1
	public DamageReport = DEFAULT_DAMAGE_REPORT
	public CheckPlanes: Bit = 0
	public CheckVehicles: Bit = 0
	public readonly Country?: ReadonlySet<Country>
	public ObjectScript?: Set<string>
	public ObjectName?: Set<string>

	public EventsFilterSpawned: Bit = 0
	public EventsFilterEnteredSimple: Bit = 0
	public EventsFilterEnteredAlive: Bit = 0
	public EventsFilterLeftSimple: Bit = 0
	public EventsFilterLeftAlive: Bit = 0
	public EventsFilterFinishedSimple: Bit = 0
	public EventsFilterFinishedAlive: Bit = 0
	public EventsFilterStationaryAndAlive: Bit = 0
	public EventsFilterFinishedStationaryAndAlive: Bit = 0
	public EventsFilterTookOff: Bit = 0
	public EventsFilterDamaged: Bit = 0
	public EventsFilterCriticallyDamaged: Bit = 0
	public EventsFilterRepaired: Bit = 0
	public EventsFilterKilled: Bit = 0
	public EventsFilterDropedBombs: Bit = 0
	public EventsFilterFiredFlare: Bit = 0
	public EventsFilterFiredRockets: Bit = 0
	public EventsFilterDroppedCargoContainers: Bit = 0
	public EventsFilterDeliveredCargo: Bit = 0
	public EventsFilterParatrooperJumped: Bit = 0
	public EventsFilterParatrooperLandedAlive: Bit = 0

	// Valid Complex Trigger event type name and ID constants
	get EVENTS() {
		return {
			OnObjectSpawned: 57,
			OnObjectEntered: 58,
			OnObjectEnteredAlive: 59,
			OnObjectLeft: 60,
			OnObjectLeftAlive: 61,
			OnObjectFinished: 62,
			OnObjectFinishedAlive: 63,
			OnObjectStationaryAndAlive: 64,
			OnObjectFinishedStationaryAndAlive: 65,
			OnObjectTookOff: 66,
			OnObjectDamaged: 67,
			OnObjectCriticallyDamaged: 68,
			OnObjectRepaired: 69,
			OnObjectKilled: 70,
			OnObjectDroppedBombs: 71,
			OnObjectFiredRockets: 72,
			OnObjectFiredFlare: 73,
			OnObjectDroppedCargoContainers: 75,
			OnObjectDeliveredCargo: 76,
			OnObjectParatrooperJumped: 77,
			OnObjectParatrooperLandedAlive: 78
		}
	}

	/**
	 * Add new item country.
	 *
	 * @param countryId Country ID value.
	 */
	public addCountry(countryId: Country): void
	public addCountry(this: Mutable<this>, countryId: Country): void {

		if (!this.Country) {
			this.Country = new Set()
		}

		// Support for "alias" (hidden) countries
		this.Country.add(data.countries[countryId].alias || countryId)
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	public *toBinary(index: any): IterableIterator<Buffer> {

		yield* super.toBinary(index, BinaryType.MCU_TR_ComplexTrigger)

		const {events} = this
		let size = 36

		if (events && events.items) {
			size += events.items.length * 8
		}

		const countries: Country[] = []
		const scripts: string[] = []
		const names: string[] = []

		// Build countries list
		if (this.Country instanceof Set) {

			for (const countryId of this.Country) {

				countries.push(countryId)
				size += 4
			}
		}

		// Build scripts list
		if (this.ObjectScript instanceof Set) {

			for (const script of this.ObjectScript) {

				scripts.push(script)
				size += 4 + Buffer.byteLength(script)
			}
		}

		// Build names list
		if (this.ObjectName instanceof Set) {

			for (const name of this.ObjectName) {

				names.push(name)
				size += 4 + Buffer.byteLength(name)
			}
		}

		const buffer = Buffer.allocUnsafe(size)

		// Events list
		this.writeEvents(buffer)

		// Cylinder
		this.writeUInt8(buffer, this.Cylinder)

		// Radius
		this.writeDouble(buffer, this.Radius)

		// DamageReport
		this.writeUInt32(buffer, this.DamageReport)

		// DamageThreshold
		this.writeUInt8(buffer, this.DamageThreshold)

		// CheckPlanes
		this.writeUInt8(buffer, this.CheckPlanes)

		// CheckVehicles
		this.writeUInt8(buffer, this.CheckVehicles)

		// EventsFilter* properties
		let eventsFilterValue = 0

		eventFilters.forEach((eventFilterProp, eventFilterIndex) => {

			// NOTE: In binary file event filter properties are stored as individual
			// bits (flags) in a 32-bit unsigned integer value.
			if ((this as any)[eventFilterProp]) {
				eventsFilterValue |= 1 << eventFilterIndex
			}
		})

		this.writeUInt32(buffer, eventsFilterValue)

		// Country filter list
		this.writeUInt32Array(buffer, countries)

		// ObjectScript filter list size
		this.writeUInt32(buffer, scripts.length)

		// ObjectScript filter list items
		scripts.forEach(script => {
			this.writeString(buffer, Buffer.byteLength(script), script)
		})

		// ObjectName filter list size
		this.writeUInt32(buffer, names.length)

		// ObjectName filter list items
		names.forEach(name => {
			this.writeString(buffer, Buffer.byteLength(name), name)
		})

		yield buffer
	}
}
