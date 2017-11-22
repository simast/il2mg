import data, {ItemFlag} from "../data"

// Make airfield plane item
export default function makeAirfieldPlane(airfield, item) {

	const sector = item[5]
	const maxSize = item[7]
	const planesBySector = airfield.planesBySector
	let taxiRoute = item[6]
	let taxiOffset
	let playerTaxiRoute

	// Extended taxi route data as array
	if (Array.isArray(taxiRoute)) {

		taxiOffset = taxiRoute[1] // Spawn offset in meters
		taxiRoute = taxiRoute[0]
	}

	// NOTE: Negative taxi routes are player-only taxi routes
	if (taxiRoute < 0) {

		playerTaxiRoute = Math.abs(taxiRoute)
		taxiRoute = 0
	}

	// Build taxi spawn point by sector index (used when spawning flights)
	const taxiSpawnsBySector = airfield.taxiSpawnsBySector
	let taxiSpawn

	if (taxiSpawnsBySector) {

		if (!taxiSpawnsBySector[sector]) {
			taxiSpawnsBySector[sector] = Object.create(null)
		}

		if (taxiRoute !== false) {

			if (!taxiSpawnsBySector[sector][taxiRoute]) {
				taxiSpawnsBySector[sector][taxiRoute] = []
			}

			taxiSpawn = {
				position: item.slice(1, 4), // X/Y/Z position
				orientation: item[4], // Orientation
				size: maxSize // Max plane size
			}

			// Mark route to be activated for this plane spawn
			if (playerTaxiRoute) {
				taxiSpawn.route = playerTaxiRoute
			}
			else if (taxiRoute > 0) {
				taxiSpawn.route = taxiRoute
			}

			// Include taxi spawn offset
			if (taxiOffset) {
				taxiSpawn.offset = taxiOffset
			}

			taxiSpawnsBySector[sector][taxiRoute].push(taxiSpawn)
		}
	}

	// No active planes
	if (!planesBySector || !planesBySector[sector] ||
			!planesBySector[sector][maxSize]) {

		return
	}

	const planeData = planesBySector[sector][maxSize].shift()

	if (!planeData) {
		return
	}

	const rand = this.rand
	const plane = this.planes[planeData[0]]
	const planeItemsByUnit = airfield.planeItemsByUnit
	const staticPlanes = rand.shuffle(plane.static || [])
	let planeStatic
	let isCamo = (item[8] === ItemFlag.PlaneCamouflage)

	// 75% chance to use camouflaged static plane when camo flag is set
	if (isCamo) {
		isCamo = rand.bool(0.75)
	}

	// Find static plane model
	for (const staticPlaneID of staticPlanes) {

		const staticPlane = data.getItemType(staticPlaneID)

		if ((staticPlane.camo && !isCamo) || (isCamo && !staticPlane.camo)) {
			continue
		}

		planeStatic = staticPlane
		break
	}

	// No matching static planes found
	if (!planeStatic) {
		return
	}

	// Create static plane item
	const planeItem = this.createItem(planeStatic, false)

	let positionX = item[1]
	const positionY = item[2]
	let positionZ = item[3]
	let orientation = item[4]
	let orientationOffset = 15

	// 25% chance to slightly move plane position forward (with taxi routes only)
	if (taxiRoute !== false && !planeStatic.camo && rand.bool(0.25)) {

		let positionOffsetMin = 10
		let positionOffsetMax = 20

		// Limit position offset for player-only taxi routes
		if (taxiRoute === 0) {

			positionOffsetMin = 5
			positionOffsetMax = 12
		}

		const positionOffset = rand.real(positionOffsetMin, positionOffsetMax, true)
		const orientationRad = orientation * (Math.PI / 180)

		positionX += positionOffset * Math.cos(orientationRad)
		positionZ += positionOffset * Math.sin(orientationRad)

		orientationOffset = 40
	}

	// Slightly vary/randomize plane orientation
	orientation = orientation + rand.real(-orientationOffset, orientationOffset)
	orientation = Math.max((orientation + 360) % 360, 0)

	planeItem.setCountry(planeData[1])
	planeItem.setPosition(positionX, positionY, positionZ)
	planeItem.setOrientation(orientation)

	const unitID = planeData[2]
	const planeIndexData = {
		group: plane.group, // Plane group ID
		item: planeItem // Plane static item object
	}

	// Build plane item count by unit and sector index (used when spawning flights)
	planeItemsByUnit[unitID] = planeItemsByUnit[unitID] || Object.create(null)
	planeItemsByUnit[unitID][sector] = planeItemsByUnit[unitID][sector] || []
	planeItemsByUnit[unitID][sector].push(planeIndexData)

	// Assign static plane item object to current taxi point
	if (taxiSpawn) {
		taxiSpawn.plane = planeIndexData
	}

	// Build a counted list of planes (by plane group) in each sector
	// NOTE: This is used as a backup when spawning flights on the airfield
	let planeGroupSectors = airfield.taxiSectorsByPlaneGroup

	if (!planeGroupSectors[plane.group]) {
		planeGroupSectors[plane.group] = Object.create(null)
	}

	planeGroupSectors = planeGroupSectors[plane.group]

	if (!planeGroupSectors[sector]) {
		planeGroupSectors[sector] = 1
	}
	else {
		planeGroupSectors[sector]++
	}

	return [planeItem]
}