/** @copyright Simas Toleikis, 2015 */
"use strict"

const fs = require("fs")
const os = require("os")
const getSlug = require("speakingurl")
const data = require("./data")

// FIXME: Used to automatically track buffer write cursor
Buffer.prototype._offset = 0

// Base (and generic) mission item
class Item {

	/**
	 * Create a new mission item.
	 *
	 * @param {string} type Item type name.
	 * @constructor
	 */
	constructor(type) {

		// The explicit type value is only required for generic items
		if (Object.getPrototypeOf(this) !== Item.prototype) {
			return
		}

		if (typeof type !== "string" || !type.length) {
			throw new TypeError("Invalid item type value.")
		}

		Object.defineProperty(this, "type", {value: type})
	}

	// By default all items have "Index" field
	get hasIndex() { return true }

	/**
	 * Create a new child item (linked to current item mission).
	 *
	 * @param {string} itemType Item type name.
	 */
	createItem(itemType) {

		if (!this.mission) {
			throw new TypeError("Item is not part of a mission.")
		}

		return this.mission.createItem(itemType, this)
	}

	/**
	 * Add a new child item.
	 *
	 * @param {Item} item Child item object.
	 */
	addItem(item) {

		if (!(item instanceof Item)) {
			throw new TypeError("Invalid child item value.")
		}

		// Initialize child items list
		if (!this.items) {
			Object.defineProperty(this, "items", {value: []})
		}

		// Add child item
		this.items.push(item)

		// Set child item parent reference
		Object.defineProperty(item, "parent", {
			value: this,
			configurable: true
		})
	}

	/**
	 * Remove/detach item from parent item hierarchy.
	 */
	remove() {

		if (!this.parent) {
			throw new Error("Item has no parent.")
		}

		const parent = this.parent

		if (!parent.items || !parent.items.length) {
			throw new Error("Parent item has no children.")
		}

		const itemIndex = parent.items.indexOf(this)

		if (itemIndex < 0) {
			throw new Error("Item is not part of a parent.")
		}

		// Remove item from parent item hierarchy
		parent.items.splice(itemIndex, 1)
		delete this.parent
	}

	/**
	 * Set item name.
	 *
	 * @param {mixed} name Localized (number) or non-localized (string) name.
	 */
	setName(name) {

		if (typeof name === "number") {
			this.LCName = name
		}
		else if (typeof name === "string") {
			this.Name = name
		}
		else {
			throw new TypeError("Invalid item name value.")
		}
	}

	/**
	 * Set item description.
	 *
	 * @param {mixed} desc Localized (number) or non-localized (string) description.
	 */
	setDescription(desc) {

		if (typeof desc === "number") {
			this.LCDesc = desc
		}
		else if (typeof desc === "string") {
			this.Desc = desc
		}
		else {
			throw new TypeError("Invalid item description value.")
		}
	}

	/**
	 * Set item position.
	 *
	 * @param {number|array} [...] Position X/Y/Z coordinates.
	 */
	setPosition() {

		// TODO: Validate item position in context of mission map size
		// TODO: Build a items index (to quickly lookup items based on position)

		// Array position version: setPosition([X, Y, Z])
		let position = arguments[0]

		if (!Array.isArray(position)) {

			// Short X/Z position version: setPosition(X, Z)
			if (arguments.length === 2) {
				position = [arguments[0], 0, arguments[1]]
			}
			// Argument position version: setPosition(X, Y, Z)
			else {
				position = [arguments[0], arguments[1], arguments[2]]
			}
		}

		if (position[0] || this.XPos) {
			this.XPos = Number(position[0].toFixed(Item.PRECISION_POSITION))
		}

		if (position[1] || this.YPos) {
			this.YPos = Number(position[1].toFixed(Item.PRECISION_POSITION))
		}

		if (position[2] || this.ZPos) {
			this.ZPos = Number(position[2].toFixed(Item.PRECISION_POSITION))
		}
	}

	/**
	 * Set item position close to another nearby item.
	 *
	 * @param {Item} item Nearby item object.
	 */
	setPositionNear(targetItem) {

		if (!(targetItem instanceof Item)) {
			throw new TypeError("Invalid nearby item value.")
		}

		// TODO: Improve nearby item positioning algorithm

		const rand = targetItem.mission.rand
		const orientation = rand.real(0, 360) * (Math.PI / 180)
		const magnitude = rand.integer(30, 60)
		const itemPosX = targetItem.XPos || 0
		const itemPosZ = targetItem.ZPos || 0

		const posX = itemPosX + magnitude * Math.cos(orientation)
		const posZ = itemPosZ + magnitude * Math.sin(orientation)

		// Set nearby position
		this.setPosition(posX, targetItem.YPos, posZ)
	}

	/**
	 * Set item orientation.
	 *
	 * @param {number|array} [...] Orientation X/Y/Z coordinates.
	 */
	setOrientation() {

		// Array orientation version: setOrientation([X, Y, Z])
		let orientation = arguments[0]

		if (!Array.isArray(orientation)) {

			// Short Y orientation version: setOrientation(Y)
			if (arguments.length === 1) {
				orientation = [0, arguments[0], 0]
			}
			// Argument orientation version: setOrientation(X, Y, Z)
			else {
				orientation = [arguments[0], arguments[1], arguments[2]]
			}
		}

		if (orientation[0] || this.XOri) {
			this.XOri = Number(orientation[0].toFixed(Item.PRECISION_ORIENTATION))
		}

		if (orientation[1] || this.YOri) {
			this.YOri = Number(orientation[1].toFixed(Item.PRECISION_ORIENTATION))
		}

		if (orientation[2] || this.ZOri) {
			this.ZOri = Number(orientation[2].toFixed(Item.PRECISION_ORIENTATION))
		}
	}

	/**
	 * Set item orientation to another target item object or position.
	 *
	 * @param {number|array|object} [...] Target coordinates or target item object.
	 */
	setOrientationTo() {

		let targetX
		let targetY // eslint-disable-line no-unused-vars
		let targetZ

		// Arguments as another target item object: setOrientationTo(item)
		if (arguments[0] instanceof Item) {

			const targetItem = arguments[0]

			targetX = targetItem.XPos || 0

			if (targetItem.YPos) {
				targetY = targetItem.YPos
			}

			targetZ = targetItem.ZPos || 0
		}
		// Arguments as array of target position components: setOrientationTo([X, Y, Z])
		else if (Array.isArray(arguments[0])) {

			const targetPosition = arguments[0]

			targetX = targetPosition[0]

			if (targetPosition.length > 2) {

				targetY = targetPosition[1]
				targetZ = targetPosition[2]
			}
			else {
				targetZ = targetPosition[1]
			}
		}
		// Arguments as separate target position components: setOrientationTo(X, Y, Z)
		else {

			targetX = arguments[0]

			if (arguments.length > 2) {

				targetY = arguments[1]
				targetZ = arguments[2]
			}
			else {
				targetZ = arguments[1]
			}
		}

		// Unknown/invalid orientation target position
		if (targetX === undefined || targetZ === undefined) {
			throw new TypeError("Invalid orientation target value.")
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
	 * @param {number} countryID Country ID value.
	 */
	setCountry(countryID) {

		if (typeof countryID !== "number") {
			throw new TypeError("Invalid item country value.")
		}

		// Support for "alias" (hidden) countries
		countryID = data.countries[countryID].alias || countryID

		this.Country = countryID
	}

	/**
	 * Add a new item target link.
	 *
	 * @param {Item} item Target item object to link.
	 */
	addTarget(item) {

		if (!(item instanceof Item)) {
			throw new TypeError("Invalid target item value.")
		}

		this.Targets = this.Targets || []

		// Add a new item target link
		if (this.Targets.indexOf(item.Index) === -1) {
			this.Targets.push(item.Index)
		}
	}

	/**
	 * Remove existing item target link.
	 *
	 * @param {Item} item Target item to remove as a link.
	 */
	removeTarget(item) {

		if (!(item instanceof Item)) {
			throw new TypeError("Invalid target item value.")
		}

		if (!this.Targets || !this.Targets.length) {
			return
		}

		const itemPos = this.Targets.indexOf(item.Index)

		// Remove existing item link
		if (itemPos > -1) {
			this.Targets.splice(itemPos, 1)
		}
	}

	/**
	 * Add a new item object link.
	 *
	 * @param {Item} item Target item object to link.
	 */
	addObject(item) {

		if (!(item instanceof Item)) {
			throw new TypeError("Invalid object item value.")
		}

		// Object links are always linked to entities
		if (!item.entity) {
			item.createEntity()
		}

		this.Objects = this.Objects || []

		// Add a new item object link
		if (this.Objects.indexOf(item.entity.Index) === -1) {
			this.Objects.push(item.entity.Index)
		}
	}

	/**
	 * Remove existing item object link.
	 *
	 * @param {Item} item Target item object to remove as a link.
	 */
	removeObject(item) {

		if (!(item instanceof Item)) {
			throw new TypeError("Invalid object item value.")
		}

		if (!item.entity || !this.Objects || !this.Objects.length) {
			return
		}

		const itemPos = this.Objects.indexOf(item.entity.Index)

		// Remove existing item object link
		if (itemPos > -1) {
			this.Objects.splice(itemPos, 1)
		}
	}

	/**
	 * Create a linked item entity.
	 *
	 * @param {boolean} disabled Create entity in a disabled state.
	 * @returns {Item} Linked item entity.
	 */
	createEntity(disabled) {

		if (this.entity) {
			throw new Error("Item is already linked to an entity.")
		}

		const entity = this.mission.createItem("MCU_TR_Entity", false)

		// Link the item with entity
		this.LinkTrId = entity.Index
		entity.MisObjID = this.Index

		Object.defineProperty(this, "entity", {value: entity})

		// Set entity to an initial disabled state
		if (disabled) {
			entity.Enabled = 0
		}

		return entity
	}

	/**
	 * Get string representation of the item.
	 *
	 * @param {number} indentLevel Indentation level.
	 * @returns {string} String representation of the item.
	 */
	toString(indentLevel) {

		indentLevel = indentLevel || 0

		const indent = new Array(2 * indentLevel + 1).join(" ")
		let value = indent + this.type + os.EOL + indent + "{"

		// Build property and value textual representation
		function propertyToString(propName, propValue) {

			const propType = typeof propValue
			let isArray = false
			let isArrayComplex = false

			if (propType === "object") {

				// Set with multiple values output
				if (propValue instanceof Set) {

					// Repeat property name for each set value
					for (const setValue of propValue) {
						propertyToString(propName, setValue)
					}

					return
				}

				isArray = Array.isArray(propValue)
				isArrayComplex = isArray && (typeof propValue[0] === "object")
			}

			value += os.EOL + indent + "  " + propName

			if (!isArrayComplex) {
				value += " = "
			}

			// Quoted string output
			if (propType === "string" && !(propValue instanceof String)) {

				// HACK: The .Mission file parser does not seem to support UTF-8/unicode
				// characters and will fail to load the mission when there are any. As a
				// workaround we transliterate "Name" string to a safe ASCII character set.
				// FIXME: Drop this speakingurl module dependency!
				if (propName === "Name") {

					propValue = getSlug(propValue, {
						maintainCase: true,
						uric: true,
						mark: true,
						separator: " "
					})
				}

				value += '"' + propValue + '"'
			}
			// Complex array output
			else if (isArrayComplex) {

				value += os.EOL + indent + "  {"

				propValue.forEach(itemValue => {

					value += os.EOL + indent + "    "

					// Inner list of items joined by ":" symbol
					if (Array.isArray(itemValue)) {
						value += itemValue.join(":")
					}
					// Item as a quoted string
					else {
						value += '"' + itemValue + '"'
					}

					value += ";"
				})

				value += os.EOL + indent + "  }"
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
				value += ""
			}
		}

		// Build item properties list
		Object.keys(this).forEach(propName => {
			propertyToString(propName, this[propName])
		})

		// Serialize any child items
		if (this.items && this.items.length) {

			this.items.forEach(item => {

				value += os.EOL

				// Don't add extra whitespace for generic items
				if (Item[item.type]) {
					value += os.EOL
				}

				value += item.toString(indentLevel + 1)
			})
		}

		value += os.EOL + indent + "}"

		// Include linked item entity
		if (this.entity) {
			value += os.EOL + os.EOL + this.entity.toString(indentLevel)
		}

		return value
	}

	/**
	 * Get base binary representation of the item.
	 *
	 * @param {object} index Binary data index object.
	 * @param {number} typeID Binary item type ID.
	 * @returns {Buffer} Base binary representation of the item.
	 */
	*toBinary(index, typeID) {

		if (!typeID) {
			throw new Error("Invalid binary item type ID.")
		}

		// Write base item binary information
		const buffer = new Buffer(46)

		// Item binary type ID
		this.writeUInt32(buffer, typeID)

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
	 * @param {Buffer} buffer Target buffer object.
	 */
	writePosition(buffer) {

		// NOTE: Position in binary file is represented as a 64 bit double-precision
		// floating-point value.

		// TODO: Validate position values (take into account mission map size)

		this.writeDouble(buffer, this.XPos || 0)
		this.writeDouble(buffer, this.YPos || 0)
		this.writeDouble(buffer, this.ZPos || 0)
	}

	/**
	 * Write XOri/YOri/ZOri to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 */
	writeOrientation(buffer) {

		// NOTE: Orientation in binary file is represented as a 16 bit unsigned integer
		// number between 0 (equal to 0 degrees) and 60000 (equal to 360 degrees).
		const degreeValue = 60000 / 360

		this.writeUInt16(buffer, Math.round(degreeValue * (this.XOri ? this.XOri : 0)))
		this.writeUInt16(buffer, Math.round(degreeValue * (this.YOri ? this.YOri : 0)))
		this.writeUInt16(buffer, Math.round(degreeValue * (this.ZOri ? this.ZOri : 0)))
	}

	/**
	 * Write a string value to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} stringLength String value length in bytes.
	 * @param {string} stringValue String value to write.
	 */
	writeString(buffer, stringLength, stringValue) {

		// NOTE: String values are represented in binary files as a length (32 bit
		// unsigned integer) followed by an array of string byte characters.

		// String length
		this.writeUInt32(buffer, stringLength)

		// String value
		if (stringLength > 0) {

			buffer.write(stringValue, buffer._offset, stringLength)
			buffer._offset += stringLength
		}
	}

	/**
	 * Write a 32 bit unsigned integer value to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} numberValue Number value to write.
	 */
	writeUInt32(buffer, numberValue) {

		buffer.writeUInt32LE(numberValue, buffer._offset)
		buffer._offset += 4
	}

	/**
	 * Write a 16 bit unsigned integer value to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} numberValue Number value to write.
	 */
	writeUInt16(buffer, numberValue) {

		buffer.writeUInt16LE(numberValue, buffer._offset)
		buffer._offset += 2
	}

	/**
	 * Write a 8 bit unsigned integer value to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} numberValue Number value to write.
	 */
	writeUInt8(buffer, numberValue) {

		buffer.writeUInt8(numberValue, buffer._offset)
		buffer._offset += 1
	}

	/**
	 * Write a double-precision floating-point value to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} numberValue Number value to write.
	 */
	writeDouble(buffer, numberValue) {

		buffer.writeDoubleLE(numberValue, buffer._offset)
		buffer._offset += 8
	}

	/**
	 * Write a single-precision floating-point value to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} numberValue Number value to write.
	 */
	writeFloat(buffer, numberValue) {

		buffer.writeFloatLE(numberValue, buffer._offset)
		buffer._offset += 4
	}

	/**
	 * Write an array of 32 bit unsigned integer values to the given Buffer object.
	 *
	 * @param {Buffer} buffer Target buffer object.
	 * @param {number} arrayValue Array value to write.
	 */
	writeUInt32Array(buffer, arrayValue) {

		// Array length
		this.writeUInt32(buffer, arrayValue.length)

		// Array values
		for (let i = 0; i < arrayValue.length; i++) {

			const value = arrayValue[i]

			// Check for valid integer value
			if (!Number.isInteger(value)) {
				throw new Error("Invalid item array value.")
			}

			this.writeUInt32(buffer, value)
		}
	}

	/**
	 * Read a list of items from a text file.
	 *
	 * @param {string} file Item text file name/path.
	 * @returns {array} List of items.
	 */
	static readTextFile(file) {

		const fileContent = fs.readFileSync(file, {
			encoding: "ascii" // TODO
		})

		if (!fileContent.length) {
			throw new Error("Could not read specified item file (no content).")
		}

		const Lexer = require("lex")
		const lexer = new Lexer()
		const items = []
		const itemStack = []

		// Rule for the start of item definition
		lexer.addRule(/\s*(\w+)\s*{\s*/i, (matched, itemType) => {

			let item

			// Normal item
			if (Item[itemType]) {
				item = new Item[itemType]()
			}
			// Generic item
			else {
				item = new Item(itemType)
			}

			// Add new item to active items stack
			itemStack.push(item)
		})

		// Rule for item property
		lexer.addRule(/\s*(\w+)\s*=\s*(.+);\s*/i, (matched, propName, propValue) => {

			const item = itemStack[itemStack.length - 1]

			// Escape backslash (\) character for JavaScript strings
			propValue = propValue.replace(/\\/g, "\\\\")

			// TODO: Handle complex property types (like with the Options item)

			// Add item property
			item[propName] = JSON.parse(propValue)
		})

		// Rule for the end of item definition
		lexer.addRule(/\s*}\s*/i, () => {

			const item = itemStack.pop()

			// Root item element
			if (!itemStack.length) {
				items.push(item)
			}
			// Child item element
			else {
				itemStack[itemStack.length - 1].addItem(item)
			}
		})

		lexer.setInput(fileContent)
		lexer.lex()

		// Make sure the stack is empty
		if (itemStack.length) {
			throw new Error()
		}

		return items
	}
}

// Default item data values
Item.DEFAULT_COALITION = 0 // Neutral coalition ID
Item.DEFAULT_COUNTRY = 0 // Neutral country ID
Item.DEFAULT_DAMAGE_REPORT = 50 // 50% of damage
Item.DEFAULT_DURABILITY = 5000

// Precision of position and orientation values (decimal places)
Item.PRECISION_POSITION = 2
Item.PRECISION_ORIENTATION = 2

module.exports = Item

// Load all supported mission item types
;[
	require("./item/Airfield"),
	require("./item/Block"),
	require("./item/Bridge"),
	require("./item/Effect"),
	require("./item/Flag"),
	require("./item/Ground"),
	require("./item/Group"),
	require("./item/MCU_Activate"),
	require("./item/MCU_CheckZone"),
	require("./item/MCU_CMD_AttackArea"),
	require("./item/MCU_CMD_Cover"),
	require("./item/MCU_CMD_Effect"),
	require("./item/MCU_CMD_ForceComplete"),
	require("./item/MCU_CMD_Formation"),
	require("./item/MCU_CMD_Land"),
	require("./item/MCU_CMD_TakeOff"),
	require("./item/MCU_Counter"),
	require("./item/MCU_Deactivate"),
	require("./item/MCU_Delete"),
	require("./item/MCU_Icon"),
	require("./item/MCU_Proximity"),
	require("./item/MCU_Spawner"),
	require("./item/MCU_Timer"),
	require("./item/MCU_TR_ComplexTrigger"),
	require("./item/MCU_TR_Entity"),
	require("./item/MCU_TR_MissionBegin"),
	require("./item/MCU_TR_MissionEnd"),
	require("./item/MCU_Waypoint"),
	require("./item/Options"),
	require("./item/Plane"),
	require("./item/Train"),
	require("./item/Vehicle")
]
.forEach(item => {

	Object.defineProperty(item.prototype, "type", {value: item.name})
	Item[item.name] = item
})