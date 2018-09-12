import sylvester from "sylvester"
import * as MCU_Icon from "../item/MCU_Icon"

// Map season types
// NOTE: Order is important (used when defining plane skins for each season)!
export const MapSeason = Object.freeze({
	Spring: "spring",
	Summer: "summer",
	Autumn: "autumn",
	Winter: "winter",
	Desert: "desert"
})

// Map colors as RGB array values
export const MapColor = Object.freeze({
	Attack: [156, 156, 156],
	Route: [52, 52, 52],
	// NOTE: Special color values that will change in-game based on user settings
	Enemy: [10, 0, 0],
	Friend: [0, 0, 10]
})

// Restricted zone around map area border
// NOTE: Using 1 extra point to not overlap with map grid and location search
export const RESTRICTED_BORDER = 20000 + 1 // 20 Km

// Generate mission map data
export default function makeMap() {

	const options = this.items.Options
	const map = {}

	Object.assign(map, this.battle.map)

	const seasonData = map.season[this.season]

	if (!seasonData) {
		throw new Error("Could not find a valid battle map!")
	}

	delete map.season
	Object.assign(map, seasonData)

	// Set map data
	options.HMap = map.heightmap
	options.Textures = map.textures
	options.Forests = map.forests
	options.Layers = "" // TODO: ?
	options.GuiMap = map.gui
	options.SeasonPrefix = map.prefix

	// Set active mission map data
	this.map = map
}

// Get X/Z point from given point/position/vector arguments
function getPointFromArgs(args) {

	const {Vector} = sylvester
	let posX, posZ

	// Array argument
	if (Array.isArray(args[0])) {
		args = args[0]
	}
	// Vector argument
	else if (args[0] instanceof Vector) {
		args = args[0].elements
	}

	// Position as three X/Y/Z arguments or a single [X,Y,Z] array argument
	if (args.length > 2) {
		[posX, , posZ] = args
	}
	// Point as two X/Z arguments or a single [X,Z] array argument
	else if (args.length > 1) {
		[posX, posZ] = args
	}
	else {
		throw new TypeError()
	}

	return [posX, posZ]
}

// Check if a given point/position/vector is offmap
export function isOffmap(map, ...args) {

	const [posX, posZ] = getPointFromArgs(args)

	return (posX < 0 || posZ < 0 || posX > map.height || posZ > map.width)
}

// Check if a given point/position/vector is in the restricted map border zone
export function isRestricted(map, ...args) {

	const [posX, posZ] = getPointFromArgs(args)

	return (posX < RESTRICTED_BORDER ||
		posX > (map.height - RESTRICTED_BORDER) ||
		posZ < RESTRICTED_BORDER ||
		posZ > (map.width - RESTRICTED_BORDER))
}

// Get map border bounds intersection data
export function getMapIntersection(map, fromVector, toVector, distance) {

	const {Sylvester, Vector, Line, Plane} = sylvester
	let borderPlanesCache = getMapIntersection.borderPlanesCache

	// Initialize map border planes cache
	if (!borderPlanesCache) {
		borderPlanesCache = getMapIntersection.borderPlanesCache = new Map()
	}

	// Lookup cached border planes
	let borderPlanes = borderPlanesCache.get(map)

	if (!borderPlanes) {

		borderPlanes = [
			Plane.create(Vector.Zero(3), Vector.create([0, 0, 1])), // Left
			Plane.create(Vector.create([map.height, 0, 0]), Vector.create([-1, 0, 0])), // Top
			Plane.create(Vector.create([map.height, 0, map.width]), Vector.create([0, 0, -1])), // Right
			Plane.create(Vector.create([0, 0, map.width]), Vector.create([1, 0, 0])) // Bottom
		]

		borderPlanesCache.set(map, borderPlanes)
	}

	if (!distance) {
		distance = fromVector.distanceFrom(toVector)
	}

	const intersectLine = Line.create(fromVector, toVector.subtract(fromVector))

	// Test each map border plane for intersections
	for (const borderPlane of borderPlanes) {

		const intersectVector = borderPlane.intersectionWith(intersectLine)

		if (!intersectVector) {
			continue
		}

		// Ignore offmap intersection points
		if (isOffmap(map, intersectVector.round())) {
			continue
		}

		const distanceToIntersect = fromVector.distanceFrom(intersectVector)
		const distanceFromIntersect = intersectVector.distanceFrom(toVector)
		const distanceDelta = Math.abs(distance - (distanceToIntersect + distanceFromIntersect))

		// Ignore invalid intersection points
		if (distanceDelta > Sylvester.precision) {
			continue
		}

		return {
			intersectVector, // Vector of intersection
			borderPlane, // Intersected border plane
			distance, // Total distance between from/to vectors
			distanceToIntersect, // Distance between "fromVector" and intersection vector
			distanceFromIntersect // Distance between intersection vector and "toVector"
		}
	}
}

// Mark map area with a circle (with all GUI icons owned by a given flight)
export function markMapArea(flight, {
	position, // Center positions of the circle
	radius = 5000,
	perfect, // Draw a perfect circle
	centerIcon, // Draw center icon
	lineType, // MCU_Icon line type
	color // Circle color
}) {

	const {Vector, Line} = sylvester
	const rand = this.rand
	const centerVector = Vector.create(position)
	const iconDegrees = perfect ? [0, 90, 180, 270] : [0, 120, 240]
	const icons = []
	let firstZoneIcon
	let lastZoneIcon

	// NOTE: Using three or four points to define a circle area
	iconDegrees.forEach(degrees => {

		let radiusExtra = 0
		let degreesExtra = 0

		// Draw a non-perfect circle ("mark with a human hand")
		if (!perfect) {

			radiusExtra = radius * rand.real(-0.1, 0.1, true) // +- 10% radius
			degreesExtra = rand.real(-15, 15, true) // +- 15 degrees
		}

		const rotateAxisLine = Line.create(Vector.Zero(3), Vector.create([0, 1, 0]))
		const rotateRad = (degrees + degreesExtra) * (Math.PI / 180)
		let pointVector = Vector.create([radius + radiusExtra, centerVector.e(2), 0])

		// Build zone point vector
		pointVector = centerVector.add(pointVector.rotate(rotateRad, rotateAxisLine))

		const zoneIcon = flight.group.createItem("MCU_Icon")

		zoneIcon.setPosition(pointVector.elements)
		zoneIcon.setColor(color ? color : MapColor.Route)
		zoneIcon.Coalitions = [flight.coalition]
		zoneIcon.LineType = lineType ? lineType : MCU_Icon.LINE_SECTOR_2

		if (!firstZoneIcon) {
			firstZoneIcon = zoneIcon
		}
		else {
			lastZoneIcon.addTarget(zoneIcon)
		}

		lastZoneIcon = zoneIcon
		icons.push(zoneIcon)
	})

	// Connect zone icons in a loop
	lastZoneIcon.addTarget(firstZoneIcon)

	// Set icon on the center
	if (centerIcon) {

		const iconItem = flight.group.createItem("MCU_Icon")

		iconItem.setPosition(position)
		iconItem.Coalitions = [flight.coalition]
		iconItem.IconId = MCU_Icon.ICON_WAYPOINT

		icons.push(iconItem)
	}

	return icons
}
