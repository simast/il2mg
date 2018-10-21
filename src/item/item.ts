import os from 'os'

import {Immutable, Mutable} from '../types'
import data from '../data'
import {Country} from '../data/enums'
import {PRECISION_ORIENTATION, PRECISION_POSITION} from './constants'
import {convertUnicodeToASCII} from './utils'
import {BinaryType} from './enums'
import MCU_TR_Entity from './MCU_TR_Entity'

declare global {
	interface Buffer {
		_offset: number
	}
}

// FIXME: Used to automatically track buffer write cursor
Buffer.prototype._offset = 0

// Base mission item
export class Item {

	// Non-enumerable item properties
	protected readonly mission?: any
	public readonly items?: ReadonlyArray<Item>
	protected parent?: Item
	public readonly type?: string
	public readonly entity?: MCU_TR_Entity

	// Common enumerable item properties
	public Model?: string
	public Script?: string
	public Skin?: string
	public Durability?: number
	public readonly LCName?: number
	public readonly LCDesc?: number
	public readonly Name?: string
	public readonly Desc?: string
	public readonly XPos?: number
	public readonly YPos?: number
	public readonly ZPos?: number
	public readonly XOri?: number
	public readonly YOri?: number
	public readonly ZOri?: number
	public readonly Country?: Country | ReadonlySet<Country>
	public readonly Targets?: ReadonlyArray<number>
	public readonly Objects?: ReadonlyArray<number>
	public readonly Index?: number
	public readonly LinkTrId?: number

	/**
	 * Create a new mission item.
	 *
	 * @param type Item type name.
	 */
	constructor(type?: string) {

		// The explicit type value is only required for generic items
		if (Object.getPrototypeOf(this) !== Item.prototype) {
			return
		}

		if (typeof type !== 'string' || !type.length) {
			throw new TypeError('Invalid item type value.')
		}

		Object.defineProperty(this, 'type', {value: type})
	}

	// By default all items have "Index" field
	get hasIndex() {return true}

	/**
	 * Create a new child item (linked to current item mission).
	 *
	 * @param type Item type name.
	 * @returns New item.
	 */
	public createItem(type: string) {

		if (!this.mission) {
			throw new TypeError('Item is not part of a mission.')
		}

		return this.mission.createItem(type, this)
	}

	/**
	 * Add a new child item.
	 *
	 * @param item Child item object.
	 */
	public addItem(item: Item) {

		let {items} = this

		// Initialize child items list
		if (!items) {

			items = []
			Object.defineProperty(this, 'items', {value: items})
		}

		// Add child item
		(items as Array<Item>).push(item)

		// Set child item parent reference
		Object.defineProperty(item, 'parent', {
			value: this,
			configurable: true
		})
	}

	/**
	 * Remove/detach item from parent item hierarchy.
	 */
	public remove(): void {

		const {parent} = this

		if (!parent) {
			throw new Error('Item has no parent.')
		}

		const {items} = parent

		if (!items || !items.length) {
			throw new Error('Parent item has no children.')
		}

		const itemIndex = items.indexOf(this)

		if (itemIndex < 0) {
			throw new Error('Item is not part of a parent.')
		}

		// Remove item from parent item hierarchy
		(items as Array<Item>).splice(itemIndex, 1)
		delete this.parent
	}

	/**
	 * Set item name.
	 *
	 * @param name Localized (number) or non-localized (string) name.
	 */
	public setName(name: string | number): void
	public setName(this: Mutable<this>, name: string | number): void {

		if (typeof name === 'number') {
			this.LCName = name
		}
		else if (typeof name === 'string') {
			this.Name = convertUnicodeToASCII(name)
		}
		else {
			throw new TypeError('Invalid item name value.')
		}
	}

	/**
	 * Set item description.
	 *
	 * @param desc Localized (number) or non-localized (string) description.
	 */
	public setDescription(desc: string | number): void
	public setDescription(this: Mutable<this>, desc: string | number): void {

		if (typeof desc === 'number') {
			this.LCDesc = desc
		}
		else if (typeof desc === 'string') {
			this.Desc = convertUnicodeToASCII(desc)
		}
		else {
			throw new TypeError('Invalid item description value.')
		}
	}

	/**
	 * Set item position.
	 *
	 * @param position Position coordinates as an [X, Y, Z] array.
	 */
	public setPosition(position: Immutable<[number, number, number]>): void

	/**
	 * Set item position.
	 *
	 * @param x Position X coordinate.
	 * @param y Position Y coordinate.
	 * @param z Position Z coordinate.
	 */
	public setPosition(x: number, y: number, z: number): void

	/**
	 * Set item position.
	 *
	 * @param x Position X coordinate.
	 * @param z Position Z coordinate.
	 */
	public setPosition(x: number, z: number): void

	public setPosition(
		this: Mutable<this>,
		...args: [number | [number, number, number], number?, number?]
	): void {

		let position: [number, number, number]

		if (!Array.isArray(args[0])) {

			// Short X/Z position version: setPosition(X, Z)
			if (args.length === 2) {
				position = [args[0], 0, args[1]!]
			}
			// Full X/Y/Z position version: setPosition(X, Y, Z)
			else {
				position = [args[0], args[1]!, args[2]!]
			}
		}
		// Array position version: setPosition([X, Y, Z])
		else {
			position = args[0]
		}

		if (position[0] || this.XPos) {
			this.XPos = Number(position[0].toFixed(PRECISION_POSITION))
		}

		if (position[1] || this.YPos) {
			this.YPos = Number(position[1].toFixed(PRECISION_POSITION))
		}

		if (position[2] || this.ZPos) {
			this.ZPos = Number(position[2].toFixed(PRECISION_POSITION))
		}
	}

	/**
	 * Set item position close to another nearby item.
	 *
	 * @param item Nearby item object.
	 */
	public setPositionNear(item: Item): void {

		// TODO: Improve nearby item positioning algorithm

		const {rand} = item.mission
		const orientation = rand.real(0, 360) * (Math.PI / 180)
		const magnitude = rand.integer(30, 60)
		const itemPosX = item.XPos || 0
		const itemPosZ = item.ZPos || 0

		const posX = itemPosX + (magnitude * Math.cos(orientation))
		const posZ = itemPosZ + (magnitude * Math.sin(orientation))

		// Set nearby position
		this.setPosition(posX, item.YPos || 0, posZ)
	}

	/**
	 * Set item orientation.
	 *
	 * @param orientation Orientation coordinates as an [X, Y, Z] array.
	 */
	public setOrientation(orientation: Immutable<[number, number, number]>): void

	/**
	 * Set item orientation.
	 *
	 * @param x Orientation X coordinate.
	 * @param y Orientation Y coordinate.
	 * @param z Orientation Z coordinate.
	 */
	public setOrientation(x: number, y: number, z: number): void

	/**
	 * Set item orientation.
	 *
	 * @param y Orientation Y coordinate.
	 */
	public setOrientation(y: number): void

	public setOrientation(
		this: Mutable<this>,
		...args: [number | [number, number, number], number?, number?]
	): void {

		let orientation: [number, number, number]

		if (!Array.isArray(args[0])) {

			// Short Y orientation version: setOrientation(Y)
			if (args.length === 1) {
				orientation = [0, args[0], 0]
			}
			// Full X/Y/Z position version: setOrientation(X, Y, Z)
			else {
				orientation = [args[0], args[1]!, args[2]!]
			}
		}
		// Array orientation version: setOrientation([X, Y, Z])
		else {
			orientation = args[0]
		}

		if (orientation[0] || this.XOri) {
			this.XOri = Number(orientation[0].toFixed(PRECISION_ORIENTATION))
		}

		if (orientation[1] || this.YOri) {
			this.YOri = Number(orientation[1].toFixed(PRECISION_ORIENTATION))
		}

		if (orientation[2] || this.ZOri) {
			this.ZOri = Number(orientation[2].toFixed(PRECISION_ORIENTATION))
		}
	}

	/**
	 * Set item orientation to another target item.
	 *
	 * @param item Target item object.
	 */
	public setOrientationTo(item: Item): void

	/**
	 * Set item orientation to position.
	 *
	 * @param position Position coordinates as [X, Z] array.
	 */
	public setOrientationTo(position: Immutable<[number, number]>): void

	/**
	 * Set item orientation to position.
	 *
	 * @param position Position coordinates as [X, Y, Z] array.
	 */
	public setOrientationTo(position: Immutable<[number, number, number]>): void

	/**
	 * Set item orientation to position.
	 *
	 * @param x Position X coordinate.
	 * @param z Position Z coordinate.
	 */
	public setOrientationTo(x: number, z: number): void

	/**
	 * Set item orientation to position.
	 *
	 * @param x Position X coordinate.
	 * @param y Position Y coordinate.
	 * @param z Position Z coordinate.
	 */
	public setOrientationTo(x: number, y: number, z: number): void

	public setOrientationTo(...args: [Item | number | [number, number, number?], number?, number?]): void {

		let targetX: number | undefined
		let targetZ: number | undefined

		// Arguments as another target item object: setOrientationTo(item)
		if (args[0] instanceof Item) {

			const targetItem = args[0]

			targetX = targetItem.XPos || 0
			targetZ = targetItem.ZPos || 0
		}
		// Arguments as array of target position components: setOrientationTo([X, Y, Z] or [X, Z])
		else if (Array.isArray(args[0])) {

			const targetPosition = args[0]

			targetX = targetPosition[0]

			if (targetPosition.length > 2) {
				targetZ = targetPosition[2]
			}
			else {
				targetZ = targetPosition[1]
			}
		}
		// Arguments as separate target position components: setOrientationTo(X, Y, Z)
		else {

			targetX = args[0]

			if (args.length > 2) {
				targetZ = args[2]
			}
			else {
				targetZ = args[1]
			}
		}

		// Unknown/invalid orientation target position
		if (targetX === undefined || targetZ === undefined) {
			throw new TypeError('Invalid orientation target value.')
		}

		const sourceX = this.XPos || 0
		const sourceZ = this.ZPos || 0

		// TODO: Support 3D orientation

		let orientationY = Math.atan2(targetZ - sourceZ, targetX - sourceX)
		orientationY = orientationY * (180 / Math.PI)

		if (orientationY < 0) {
			orientationY += 360
		}

		// Set item Y orientation
		this.setOrientation(orientationY)
	}

	/**
	 * Set item country.
	 *
	 * @param countryId Country ID value.
	 */
	public setCountry(countryId: Country): void
	public setCountry(this: Mutable<this>, countryId: Country): void {

		// Support for "alias" (hidden) countries
		this.Country = data.countries[countryId].alias || countryId
	}

	/**
	 * Add a new item target link.
	 *
	 * @param item Target item object to link.
	 */
	public addTarget(item: Item): void
	public addTarget(this: Mutable<this>, item: Item): void {

		if (typeof item.Index !== 'number') {
			throw new TypeError('Invalid target item index value.')
		}

		let targets = this.Targets

		if (!targets) {
			targets = this.Targets = []
		}

		// Add a new item target link
		if (!targets.includes(item.Index)) {
			targets.push(item.Index)
		}
	}

	/**
	 * Remove existing item target link.
	 *
	 * @param item Target item to remove as a link.
	 */
	public removeTarget(item: Item): void
	public removeTarget(this: Mutable<this>, item: Item): void {

		const targets = this.Targets

		if (!targets || !targets.length || typeof item.Index !== 'number') {
			return
		}

		const itemTargetsIndex = targets.indexOf(item.Index)

		// Remove existing item link
		if (itemTargetsIndex !== -1) {
			targets.splice(itemTargetsIndex, 1)
		}
	}

	/**
	 * Add a new item object link.
	 *
	 * @param item Target item object to link.
	 */
	public addObject(item: Item): void
	public addObject(this: Mutable<this>, item: Item): void {

		let {entity} = item

		// Object links are always linked to entities
		if (!entity) {
			entity = item.createEntity()
		}

		let objects = this.Objects

		if (!objects) {
			objects = this.Objects = []
		}

		// Add a new item object link
		if (!objects.includes(entity.Index!)) {
			objects.push(entity.Index!)
		}
	}

	/**
	 * Remove existing item object link.
	 *
	 * @param item Target item object to remove as a link.
	 */
	public removeObject(item: Item): void
	public removeObject(this: Mutable<this>, item: Item): void {

		const objects = this.Objects
		const {entity} = item

		if (!entity || !entity.Index || !objects || !objects.length) {
			return
		}

		const itemObjectsIndex = objects.indexOf(entity.Index)

		// Remove existing item object link
		if (itemObjectsIndex !== -1) {
			objects.splice(itemObjectsIndex, 1)
		}
	}

	/**
	 * Create a linked item entity.
	 *
	 * @param disabled Create entity in a disabled state.
	 * @returns Linked item entity.
	 */
	public createEntity(disabled = false): MCU_TR_Entity {

		if (this.entity) {
			throw new Error('Item is already linked to an entity.')
		}

		const entity: MCU_TR_Entity = this.mission.createItem('MCU_TR_Entity', false)

		// Link the item with entity
		;(this as Mutable<this>).LinkTrId = entity.Index
		entity.MisObjID = this.Index

		Object.defineProperty(this, 'entity', {value: entity})

		// Set entity to an initial disabled state
		if (disabled) {
			entity.Enabled = 0
		}

		return entity
	}

	/**
	 * Get string representation of the item.
	 *
	 * @param indentLevel Indentation level.
	 * @returns String representation of the item.
	 */
	public toString(indentLevel = 0): string {

		const indent = new Array((2 * indentLevel) + 1).join(' ')
		let value = indent + this.type + os.EOL + indent + '{'

		// Build property and value textual representation
		function propertyToString(propName: string, propValue: any) {

			const propType = typeof propValue
			let isArray = false
			let isArrayComplex = false

			if (propType === 'object') {

				// Set with multiple values output
				if (propValue instanceof Set) {

					// Repeat property name for each set value
					for (const setValue of propValue) {
						propertyToString(propName, setValue)
					}

					return
				}

				isArray = Array.isArray(propValue)
				isArrayComplex = isArray && (typeof propValue[0] === 'object')
			}

			value += os.EOL + indent + '  ' + propName

			if (!isArrayComplex) {
				value += ' = '
			}

			// Quoted string output
			if (propType === 'string' && !(propValue instanceof String)) {
				value += '"' + propValue + '"'
			}
			// Complex array output
			else if (isArrayComplex) {

				value += os.EOL + indent + '  {'

				propValue.forEach((itemValue: string | string[]) => {

					value += os.EOL + indent + '    '

					// Inner list of items joined by ":" symbol
					if (Array.isArray(itemValue)) {
						value += itemValue.join(':')
					}
					// Item as a quoted string
					else {
						value += '"' + itemValue + '"'
					}

					value += ';'
				})

				value += os.EOL + indent + '  }'
			}
			// Simple array output
			else if (isArray) {
				value += JSON.stringify(propValue)
			}
			// Other value output
			else {
				value += propValue
			}

			if (!isArrayComplex) {
				value += ';'
			}
		}

		// Build item properties list
		Object.keys(this).forEach(propName => {
			propertyToString(propName, (this as any)[propName])
		})

		// Serialize any child items
		if (this.items && this.items.length) {

			this.items.forEach(item => {

				value += os.EOL

				// Don't add extra whitespace for generic items
				if (item.type && item.type in Item) {
					value += os.EOL
				}

				value += item.toString(indentLevel + 1)
			})
		}

		value += os.EOL + indent + '}'

		// Include linked item entity
		if (this.entity) {
			value += os.EOL + os.EOL + this.entity.toString(indentLevel)
		}

		return value
	}

	/**
	 * Get base binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @param typeId Binary item type ID.
	 * @yields Base item data buffer.
	 */
	public *toBinary(index: any, typeId: BinaryType): IterableIterator<Buffer> {

		// Write base item binary information
		const buffer = Buffer.allocUnsafe(46)

		// Item binary type ID
		this.writeUInt32(buffer, typeId)

		// Index
		this.writeUInt32(buffer, this.Index || 0)

		// Position
		this.writePosition(buffer)

		// Orientation
		this.writeOrientation(buffer)

		// Name string table index
		this.writeUInt16(buffer, index.name.value(this.Name))

		// Desc string table index
		this.writeUInt16(buffer, index.desc.value(this.Desc))

		// Model string table index
		this.writeUInt16(buffer, index.model.value(this.Model))

		// Skin string table index
		this.writeUInt16(buffer, index.skin.value(this.Skin))

		yield buffer
	}

	/**
	 * Write XPos/YPos/ZPos to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 */
	private writePosition(buffer: Buffer): void {

		// NOTE: Position in binary file is represented as a 64 bit double-precision
		// floating-point value.

		this.writeDouble(buffer, this.XPos || 0)
		this.writeDouble(buffer, this.YPos || 0)
		this.writeDouble(buffer, this.ZPos || 0)
	}

	/**
	 * Write XOri/YOri/ZOri to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 */
	private writeOrientation(buffer: Buffer): void {

		// NOTE: Orientation in binary file is represented as a 16 bit unsigned integer
		// number between 0 (equal to 0 degrees) and 60000 (equal to 360 degrees).
		const degreeValue = 60000 / 360

		this.writeUInt16(buffer, Math.round(degreeValue * (this.XOri || 0)))
		this.writeUInt16(buffer, Math.round(degreeValue * (this.YOri || 0)))
		this.writeUInt16(buffer, Math.round(degreeValue * (this.ZOri || 0)))
	}

	/**
	 * Write a string value to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param length String value length in bytes.
	 * @param value String value to write.
	 */
	protected writeString(buffer: Buffer, length: number, value: string): void {

		// NOTE: String values are represented in binary files as a length (32 bit
		// unsigned integer) followed by an array of string byte characters.

		// String length
		this.writeUInt32(buffer, length)

		// String value
		if (length > 0) {

			buffer.write(value, buffer._offset, length)
			buffer._offset += length
		}
	}

	/**
	 * Write a 32 bit unsigned integer value to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param value Number value to write.
	 */
	protected writeUInt32(buffer: Buffer, value: number): void {

		buffer.writeUInt32LE(value, buffer._offset)
		buffer._offset += 4
	}

	/**
	 * Write a 16 bit unsigned integer value to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param value Number value to write.
	 */
	protected writeUInt16(buffer: Buffer, value: number): void {

		buffer.writeUInt16LE(value, buffer._offset)
		buffer._offset += 2
	}

	/**
	 * Write a 8 bit unsigned integer value to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param value Number value to write.
	 */
	protected writeUInt8(buffer: Buffer, value: number): void {

		buffer.writeUInt8(value, buffer._offset)
		buffer._offset += 1
	}

	/**
	 * Write a double-precision floating-point value to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param value Number value to write.
	 */
	protected writeDouble(buffer: Buffer, value: number): void {

		buffer.writeDoubleLE(value, buffer._offset)
		buffer._offset += 8
	}

	/**
	 * Write a single-precision floating-point value to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param value Number value to write.
	 */
	protected writeFloat(buffer: Buffer, value: number): void {

		buffer.writeFloatLE(value, buffer._offset)
		buffer._offset += 4
	}

	/**
	 * Write an array of 32 bit unsigned integer values to the given Buffer object.
	 *
	 * @param buffer Target buffer object.
	 * @param arrayValue Array value to write.
	 */
	protected writeUInt32Array(buffer: Buffer, arrayValue: ReadonlyArray<number>): void {

		// Array length
		this.writeUInt32(buffer, arrayValue.length)

		// Array values
		for (let i = 0; i < arrayValue.length; i++) {

			const value = arrayValue[i]

			// Check for valid integer value
			if (!Number.isInteger(value)) {
				throw new Error('Invalid item array value.')
			}

			this.writeUInt32(buffer, value)
		}
	}
}

// Load all supported mission item types
[
	'Airfield',
	'Block',
	'Bridge',
	'Effect',
	'Flag',
	'Ground',
	'Group',
	'MCU_Activate',
	'MCU_CheckZone',
	'MCU_CMD_AttackArea',
	'MCU_CMD_Cover',
	'MCU_CMD_Effect',
	'MCU_CMD_ForceComplete',
	'MCU_CMD_Formation',
	'MCU_CMD_Land',
	'MCU_CMD_TakeOff',
	'MCU_Counter',
	'MCU_Deactivate',
	'MCU_Delete',
	'MCU_Icon',
	'MCU_Proximity',
	'MCU_Spawner',
	'MCU_Timer',
	'MCU_TR_ComplexTrigger',
	'MCU_TR_Entity',
	'MCU_TR_MissionBegin',
	'MCU_TR_MissionEnd',
	'MCU_Waypoint',
	'Options',
	'Plane',
	'Train',
	'Vehicle'
].forEach(type => {

	const item = require('./' + type).default

	Object.defineProperty(item.prototype, 'type', {value: type})
	;(Item as any)[type] = item
})
