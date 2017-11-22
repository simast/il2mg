import path from "path"
import sylvester from "sylvester"
import * as MCU_Icon from "../item/MCU_Icon"
import data, {Coalition} from "../data"
import {Location} from "./locations"
import {MapColor} from "./map"

// Territory types
export const Territory = Object.freeze({
	Front: -1,
	Unknown: 0
	// NOTE: Any positive territory type ID is a coalition ID
})

// Front line item types
export const FrontLine = Object.freeze({
	Border: 1, // Border line
	Attack: 2 // Attack arrow
})

// Map grid size
// NOTE: Territories will be more precise with smaller grid size
const GRID_SIZE = 5000 // 5 km
const GRID_SIZE_HALF = GRID_SIZE / 2

// Generate mission fronts and territories
export default function makeFronts() {

	const {Line} = sylvester

	// Territories X/Z grid
	const territories = new Map()

	// Exported public utility method to get territory type based on position
	this.getTerritory = (posX, posZ) => {

		const territoriesZ = territories.get(Math.floor(posX / GRID_SIZE))

		if (territoriesZ) {

			const gridPoint = territoriesZ.get(Math.floor(posZ / GRID_SIZE))

			// Found territory grid point type
			if (gridPoint) {
				return gridPoint.type
			}
		}

		return Territory.Unknown
	}

	// Location indexes for territories (for fronts and for each coalition)
	const locations = this.locations.territories = Object.create(null)

	// Resolve required fronts file based on mission date
	const frontsFile = this.battle.fronts[this.date.format("YYYY-MM-DD")]

	if (!frontsFile) {
		return
	}

	// Set debug mode flag
	const debugFronts = Boolean(this.debug && this.debug.fronts)

	// Load fronts data file
	const frontsData = data.load(path.join(this.battlePath, "fronts", frontsFile))

	if (!frontsData || !frontsData.length) {
		return
	}

	// Front icons group
	const frontsGroup = this.createItem("Group")
	frontsGroup.setName("FRONT")

	// Index of created point icons
	const pointItems = new Map()

	// Index of front border lines (per grid X/Z dimension) used for ray tracing
	const rayLines = {
		x: new Map(),
		z: new Map()
	}

	// Max coordinates for the territories grid
	const gridMax = {
		x: Math.floor(this.map.height / GRID_SIZE),
		z: Math.floor(this.map.width / GRID_SIZE)
	}

	// List of found territory locations
	const locationsData = Object.create(null)

	// Make front point icon item
	const makeFrontPoint = pointID => {

		// Point item is already created
		if (pointItems.has(pointID)) {
			return
		}

		const point = frontsData[pointID]
		const pointType = point[0]
		const pointX = point[1]
		const pointZ = point[2]
		const pointTargets = point[3]
		const pointItem = frontsGroup.createItem("MCU_Icon")

		pointItem.setPosition(pointX, pointZ)
		pointItem.Coalitions = this.coalitions

		// Front border line
		if (pointType === FrontLine.Border) {

			pointItem.LineType = MCU_Icon.LINE_POSITION_0

			// Show icons on front border points in debug mode
			if (debugFronts) {
				pointItem.IconId = MCU_Icon.ICON_WAYPOINT
			}

			// TODO: Follow bezier curves and generate more points for precision?

			// Set territory grid to the front line type
			const gridX = Math.floor(pointX / GRID_SIZE)
			const gridZ = Math.floor(pointZ / GRID_SIZE)

			if (gridX >= 0 && gridZ >= 0 && gridX <= gridMax.x && gridZ <= gridMax.z) {

				const territoriesZ = territories.get(gridX) || new Map()

				territoriesZ.set(gridZ, {type: Territory.Front})
				territories.set(gridX, territoriesZ)
			}
		}
		// Attack arrow
		else if (pointType === FrontLine.Attack) {

			pointItem.LineType = MCU_Icon.LINE_ATTACK
			pointItem.setColor(MapColor.Attack)
		}

		// Index point icon item
		pointItems.set(pointID, pointItem)

		// Connect point items with target links
		if (pointTargets) {

			for (const targetID of pointTargets) {

				// Target item is not yet created
				if (!pointItems.has(targetID)) {
					makeFrontPoint(targetID)
				}

				const targetItem = pointItems.get(targetID)

				pointItem.addTarget(targetItem)

				// Index front border lines per grid dimension (used for ray tracing)
				if (pointType === FrontLine.Border) {

					// Line used for ray intersection checks
					let line

					const linePos1 = {x: pointItem.XPos, z: pointItem.ZPos}
					const linePos2 = {x: targetItem.XPos, z: targetItem.ZPos}

					const gridFrom = {
						x: Math.floor(Math.min(linePos1.x, linePos2.x) / GRID_SIZE),
						z: Math.floor(Math.min(linePos1.z, linePos2.z) / GRID_SIZE)
					}

					const gridTo = {
						x: Math.floor(Math.max(linePos1.x, linePos2.x) / GRID_SIZE),
						z: Math.floor(Math.max(linePos1.z, linePos2.z) / GRID_SIZE)
					}

					// Index line for each grid dimension
					;["x", "z"].forEach(dimension => {

						for (let c = gridFrom[dimension]; c <= gridTo[dimension]; c++) {

							// Rays will be cast over the center of the grid coordinate space
							const rayPos = (c * GRID_SIZE) + GRID_SIZE_HALF

							// Skip border lines that we know will not intersect with the ray
							if ((linePos1[dimension] >= rayPos && linePos2[dimension] >= rayPos) ||
									(linePos1[dimension] <= rayPos && linePos2[dimension] <= rayPos)) {

								continue
							}

							const lineList = rayLines[dimension].get(c) || []

							// Use the same line object for all grid items
							if (!line) {

								line = Line.create(
									[linePos1.x, 0, linePos1.z],
									[linePos2.x - linePos1.x, 0, linePos2.z - linePos1.z]
								)
							}

							lineList.push(line)
							rayLines[dimension].set(c, lineList)
						}
					})
				}
			}
		}
	}

	// Process front points
	for (let pointID = 0; pointID < frontsData.length; pointID++) {
		makeFrontPoint(pointID)
	}

	// Build territories grid and location indexes
	(() => {

		// Run ray tracing over each map dimension (for precision)
		["x", "z"].forEach(dimension => {

			if (!rayLines[dimension].size) {
				return
			}

			const isXDimension = (dimension === "x")

			// Dimension and ray coordinate indexes
			const axisIndexDimension = (isXDimension ? 0 : 2)
			const axisIndexRay = (isXDimension ? 2 : 0)

			// Max grid coordinate value on the ray axis
			const maxRayGrid = (isXDimension ? gridMax.z : gridMax.x)

			// Invert front line facing direction for Z dimension
			const faceInvert = (isXDimension ? 1 : -1)

			rayLines[dimension].forEach((lineList, c) => {

				const intersections = []

				// Rays are cast over the center of the grid coordinate space
				const rayPos = (c * GRID_SIZE) + GRID_SIZE_HALF

				// Create infinite ray line used for intersection tests
				const rayLineAnchor = [0, 0, 0]
				const rayLineDirection = [0, 0, 0]

				rayLineAnchor[axisIndexDimension] = rayPos
				rayLineDirection[axisIndexRay] = 1

				const rayLine = Line.create(rayLineAnchor, rayLineDirection)

				// Check for valid intersections
				for (const line of lineList) {

					const intersectionPoint = rayLine.intersectionWith(line)

					if (!intersectionPoint) {
						continue
					}

					intersections.push({
						point: intersectionPoint,
						face: line.direction.e(axisIndexDimension + 1) * faceInvert
					})
				}

				if (!intersections.length) {
					return
				}

				// Sort intersection point list based on ascending ray axis position
				intersections.sort((a, b) => (
					a.point.e(axisIndexRay + 1) - b.point.e(axisIndexRay + 1)
				))

				const territoriesRanges = []
				let gridFrom = 0
				let coalitionID

				// Build territory ranges on the ray axis based on intersection data
				for (const intersection of intersections) {

					const intersectionCoord = intersection.point.e(axisIndexRay + 1)
					const gridTo = Math.floor(intersectionCoord / GRID_SIZE)

					// NOTE: Front lines in the game seems to be always rendered with
					// allies side on the right and axis side on the left.
					coalitionID = (intersection.face > 0 ? Coalition.Axis : Coalition.Allies)

					// Mark territory before the front line intersection
					territoriesRanges.push({
						from: gridFrom,
						to: gridTo - 2,
						type: coalitionID
					})

					// Mark front territory (with +-1 grid point around the collision zone)
					territoriesRanges.push({
						from: gridTo - 1,
						to: gridTo + 1,
						type: Territory.Front
					})

					gridFrom = gridTo + 2
				}

				// Add closing/final territory line (to the end of the map)
				if (gridFrom <= maxRayGrid) {

					territoriesRanges.push({
						from: gridFrom,
						to: maxRayGrid,
						// Invert coalition side for the final range
						type: (coalitionID === Coalition.Allies ? Coalition.Axis : Coalition.Allies)
					})
				}

				// Set identified territories to the grid
				territoriesRanges.forEach(range => {

					const rangeFrom = Math.max(range.from, 0)
					const rangeTo = Math.min(range.to, maxRayGrid)

					// NOTE: Territory grid contains references to a shared object holding
					// the type value (done for performance reasons to minimize iterations).
					const rangeType = {
						type: range.type
					}

					for (let i = rangeFrom; i <= rangeTo; i++) {

						// Invert dimension coordinates for Z axis ray tracing
						const c1 = (isXDimension ? c : i)
						const c2 = (isXDimension ? i : c)

						const territoriesAxis = territories.get(c1) || new Map()
						const existingType = territoriesAxis.get(c2)

						// Keep existing territories (from previous ray cast) - only front
						// line territories are always overridden.
						if (existingType === undefined || range.type === Territory.Front) {

							territoriesAxis.set(c2, rangeType)
							territories.set(c1, territoriesAxis)
						}
					}
				})
			})
		})

		// Use active airfields list to mark (seed) coalition territory grid.
		// NOTE: This also fixes issue where the ray tracing did not hit any front
		// lines (due to small pockets) and the rest of the territory is unknown.
		for (const coalitionID in this.airfieldsByCoalition) {
			for (const airfield of this.airfieldsByCoalition[coalitionID]) {

				if (airfield.offmap) {
					continue
				}

				const gridX = Math.floor(airfield.position[0] / GRID_SIZE)
				const gridZ = Math.floor(airfield.position[2] / GRID_SIZE)

				if (gridX >= 0 && gridZ >= 0 && gridX <= gridMax.x && gridZ <= gridMax.z) {

					const territoriesZ = territories.get(gridX) || new Map()

					territoriesZ.set(gridZ, {type: +coalitionID})
					territories.set(gridX, territoriesZ)
				}
			}
		}

		// Initial ray tracing and airfield seed did not find any territories
		if (!territories.size) {
			return
		}

		// Index location square zone (for fast lookup in the R-tree index)
		const indexLocation = (x, z, type) => {

			const location = new Location(
				x * GRID_SIZE,
				z * GRID_SIZE,
				// FIXME: Locations can overlap?
				x * GRID_SIZE + GRID_SIZE,
				z * GRID_SIZE + GRID_SIZE
			)

			if (!(type in locationsData)) {
				locationsData[type] = []
			}

			locationsData[type].push(location)
		}

		// Mark remaining territory gaps (that were not detected by ray tracing)
		const gapPoints = []
		let gapType = null

		for (let x = 0; x <= gridMax.x; x++) {

			let territoriesZ = territories.get(x)

			// Initialize missing Z territories axis
			if (!territoriesZ) {

				territoriesZ = new Map()
				territories.set(x, territoriesZ)
			}

			const isZForward = (x % 2 === 0)

			// Iterate over Z axis in alternating direction
			let z = (isZForward ? 0 : gridMax.z)

			while (z >= 0 && z <= gridMax.z) {

				let point = territoriesZ.get(z)

				if (point) {

					indexLocation(x, z, point.type)

					// Paint unknown previous gaps with this territory coalition type
					if (point.type > 0) {
						gapType = point.type
					}
				}
				else {

					point = {x, z}

					gapPoints.push(point)
					territoriesZ.set(z, point)
				}

				// Mark previous points with found territorry type
				while (gapType && gapPoints.length) {

					point = gapPoints.shift()
					point.type = gapType

					indexLocation(point.x, point.z, gapType)

					// NOTE: Not needed for the territory grid
					delete point.x
					delete point.z
				}

				// Iterate Z axis
				z += (isZForward ? 1 : -1)
			}
		}

		if (!debugFronts) {
			return
		}

		// Draw a territory line in the debug mode output
		const drawDebugLine = (posFrom, posTo, color) => {

			const lineItemFrom = frontsGroup.createItem("MCU_Icon")
			const lineItemTo = frontsGroup.createItem("MCU_Icon")

			lineItemFrom.setPosition(posFrom)
			lineItemTo.setPosition(posTo)

			lineItemFrom.LineType = lineItemTo.LineType = MCU_Icon.LINE_SECTOR_2
			lineItemFrom.Coalitions = lineItemTo.Coalitions = this.coalitions

			lineItemFrom.setColor(color)
			lineItemTo.setColor(color)

			lineItemFrom.addTarget(lineItemTo)
		}

		// Paint territories as lines in debug mode
		this.make.push(() => {

			const playerCountryID = this.player.flight.country
			const playerCoalitionID = data.countries[playerCountryID].coalition

			territories.forEach((territoriesZ, x) => {

				const posX = (x * GRID_SIZE) + GRID_SIZE_HALF

				if (posX >= this.map.height) {
					return
				}

				let type = null
				let posFrom = null
				let posTo = null
				let color = null

				// NOTE: Overflowing Z axis with +1 (to draw the closing line)
				for (let z = 0; z <= gridMax.z + 1; z++) {

					const point = territoriesZ.get(z)

					if (!point || (type !== null && point.type !== type)) {

						if (type !== null) {

							if (color && posFrom !== posTo) {
								drawDebugLine(posFrom, posTo, color)
							}

							type = posFrom = posTo = color = null
						}

						if (!point) {
							continue
						}
					}

					type = point.type

					// Draw lines only for coalition territories
					if (type <= 0) {
						continue
					}

					if (!posFrom) {
						posFrom = posTo = [posX, 0, Math.min(z * GRID_SIZE, this.map.width)]
					}
					else {
						posTo = [posX, 0, Math.min((z * GRID_SIZE) + GRID_SIZE, this.map.width)]
					}

					if (!color) {

						color = MapColor.Enemy

						if (type === playerCoalitionID) {
							color = MapColor.Friend
						}
					}
				}
			})
		})
	})()

	// Load found territory data into location indexes
	for (const territoryType in locationsData) {

		locations[territoryType] = new Location.Index()
		locations[territoryType].load(locationsData[territoryType])
	}
}