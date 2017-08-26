/** @copyright Simas Toleikis, 2015 */

import path from "path"
import addLazyProperty from "lazy-property"
import log from "../log"
import Item from "../item"
import {Location, LocationType} from "./locations"
import {isOffmap} from "./map"
import {FlightState} from "./flight"
import {PlaneSize, getPlaneSizeFromName} from "./planes"
import data, {ItemTag} from "../data"

// Airfield make parts
import makeAirfieldLimits from "./airfield.limits"
import makeAirfieldStatic from "./airfield.static"
import makeAirfieldPlane from "./airfield.plane"
import makeAirfieldBeacon from "./airfield.beacon"
import makeAirfieldWindsock from "./airfield.windsock"
import makeAirfieldEffect from "./airfield.effect"
import makeAirfieldWreck from "./airfield.wreck"
import makeAirfieldVehicle from "./airfield.vehicle"
import makeAirfieldRoutes from "./airfield.routes"
import makeAirfieldTaxi from "./airfield.taxi"

// Airfield activity zone radius
const AIRFIELD_ZONE_RADIUS = 6000

// Generate mission airfields
export default function makeAirfields() {

	const mission = this
	const battle = mission.battle
	const rand = mission.rand

	// Min and max plane size IDs
	const planeSizeMin = PlaneSize.Small
	const planeSizeMax = PlaneSize.Huge

	// Airfield index tables
	const airfields = Object.create(null)
	const airfieldsByCoalition = Object.create(null)
	const airfieldsTaxi = new Set()

	// Offmap "hot" spots by coalition (based on offmap airfield positions)
	const offmapSpotsByCoalition = Object.create(null)

	// List of airfield locations data
	const locationsData = []

	// Total airfield counts
	let totalAirfields = 0
	let totalActive = 0
	let totalOffmap = 0

	// FIXME: Remove from this scope!
	let airfieldData

	// Process each airfield
	for (const airfieldID in battle.airfields) {

		totalAirfields++

		airfieldData = battle.airfields[airfieldID]

		// Load airfield JSON data file
		try {

			Object.assign(
				airfieldData,
				data.load(path.join(this.battlePath, "airfields", airfieldID))
			)
		}
		catch (e) {}

		const airfield = airfields[airfieldID] = Object.create(null)

		airfield.id = airfieldID
		airfield.name = airfieldData.name
		const position = airfield.position = airfieldData.position

		// Register new airfield location
		const airfieldLocation = new Location(position[0], position[2])

		airfieldLocation.type = LocationType.Airfield
		airfieldLocation.name = airfieldData.name
		airfieldLocation.airfield = airfieldID

		locationsData.push(airfieldLocation)

		// Identify offmap airfield
		if (isOffmap(this.map, position)) {

			airfield.offmap = true
			totalOffmap++
		}

		// Lazy getter for airfield items group
		addLazyProperty(airfield, "group", () => {

			const airfieldGroup = mission.createItem("Group")
			airfieldGroup.setName(airfield.name)

			return airfieldGroup
		})

		const airfieldUnits = mission.unitsByAirfield[airfieldID]

		// Process airfield units
		if (airfieldUnits) {

			const sectorsIndex = Object.create(null)
			const planesIndex = Object.create(null)
			const countries = Object.create(null)

			airfield.value = 0
			airfield.planes = 0
			airfield.taxi = airfieldData.taxi
			airfield.countries = []
			airfield.countriesWeighted = [] // List of country IDs as a weighted array
			airfield.planesBySector = Object.create(null)
			airfield.planeItemsByUnit = Object.create(null)
			airfield.taxiSpawnsBySector = Object.create(null)
			airfield.taxiSectorsByPlaneGroup = Object.create(null)

			// Process unit planes list
			for (const unitID in airfieldUnits) {

				const unit = airfieldUnits[unitID]
				const groupID = unit.group

				unit.planes.forEach(planeID => {

					const plane = mission.planes[planeID]
					const planeSize = getPlaneSizeFromName(plane.size)

					if (planeSize) {

						// Airfield value is a sum of plane size IDs (with larger planes
						// adding more value than smaller ones)
						airfield.value += planeSize

						// Register unit plane country data
						airfield.countriesWeighted.push(unit.country)
						countries[unit.country] = (countries[unit.country] || 0) + 1

						// Build a list of plane groups indexed by plane size
						const planeSizeGroup = planesIndex[planeSize] = planesIndex[planeSize] || {}
						const planeGroup = planeSizeGroup[groupID] = planeSizeGroup[groupID] || []

						planeGroup.push([planeID, unit.country, unitID])
					}

					airfield.planes++
				})
			}

			// Airfield countries list
			airfield.countries = Object.keys(countries).map(Number)

			// Sort countries list by number of units present on the airfield
			airfield.countries.sort((a, b) => countries[b] - countries[a])

			// Airfield main country
			airfield.country = airfield.countries[0]

			// Airfield coalition
			airfield.coalition = data.countries[airfield.country].coalition

			// Index airfield by coalition
			if (!airfieldsByCoalition[airfield.coalition]) {
				airfieldsByCoalition[airfield.coalition] = []
			}

			airfieldsByCoalition[airfield.coalition].push(airfield)

			// Index offmap spots by coalition
			if (airfield.offmap) {

				if (!offmapSpotsByCoalition[airfield.coalition]) {
					offmapSpotsByCoalition[airfield.coalition] = []
				}

				offmapSpotsByCoalition[airfield.coalition].push([
					airfield.position[0],
					airfield.position[2]
				])
			}

			// Build a list of sectors indexed by plane size
			for (const sectorID in airfieldData.sectors) {

				for (const planeSizeID in airfieldData.sectors[sectorID]) {

					const maxPlanes = getSectorMaxPlanes(sectorID, planeSizeID)
					const sectorsByPlaneSize = sectorsIndex[planeSizeID] || []

					if (maxPlanes > 0) {
						sectorsByPlaneSize.push(sectorID)
					}

					sectorsIndex[planeSizeID] = sectorsByPlaneSize
				}
			}

			// Assign planes to sectors
			(() => {

				// NOTE: During distribution large size planes take priority over small size
				for (let planeSizeID = planeSizeMax; planeSizeID >= planeSizeMin; planeSizeID--) {

					const planesBySize = planesIndex[planeSizeID]

					if (!planesBySize) {
						continue
					}

					// TODO: Sort unit list by plane group size
					rand.shuffle(Object.keys(planesBySize)).forEach(unitID => {

						const unitPlanes = planesBySize[unitID]
						const planeSizeSectors = sectorsIndex[planeSizeID]

						if (planeSizeSectors) {

							// Sort indexed list of sectors by best fit for plane size
							planeSizeSectors.sort((a, b) => {

								const sectorSizeA = getSectorMaxPlanes(a, planeSizeID)
								const sectorSizeB = getSectorMaxPlanes(b, planeSizeID)

								return sectorSizeB - sectorSizeA
							})

							for (let i = 0; i < planeSizeSectors.length; i++) {

								if (!unitPlanes.length) {
									break
								}

								const sectorID = planeSizeSectors[i]
								const sectorMaxPlanes = getSectorMaxPlanes(sectorID, planeSizeID)
								const sectorPlanes = airfield.planesBySector[sectorID] = airfield.planesBySector[sectorID] || {}

								for (let n = 0; n < sectorMaxPlanes; n++) {

									const plane = unitPlanes.shift()
									const sector = airfieldData.sectors[sectorID]
									let sectorPlaneSize = []

									for (let x = planeSizeID; x <= planeSizeMax; x++) {

										if (sector[x] > 0) {
											sectorPlaneSize.push(x)
										}
									}

									// Assign plane to sector plane parking spot
									sectorPlaneSize = rand.pick(sectorPlaneSize)
									sectorPlanes[sectorPlaneSize] = sectorPlanes[sectorPlaneSize] || []
									sectorPlanes[sectorPlaneSize].push(plane)

									// Decrease sector plane spot count
									sector[sectorPlaneSize]--

									if (!unitPlanes.length) {
										break
									}
								}
							}
						}
					})
				}
			})()

			// Show airfield icon with number of planes in debug mode
			if (mission.debug && mission.debug.airfields && !airfield.offmap) {

				// NOTE: Icon text can only have a custom color if it is linked to another
				// icon. As a workaround - we are creating two icons at the same location.
				const airfieldIcon1 = airfield.group.createItem("MCU_Icon")
				const airfieldIcon2 = airfield.group.createItem("MCU_Icon")

				// TODO: Show icon at the edge of the map for off-map airfields
				airfieldIcon1.setPosition(position)
				airfieldIcon2.setPosition(position)

				airfieldIcon1.LineType = Item.MCU_Icon.LINE_BOLD
				airfieldIcon1.setName(mission.getLC(airfield.planes + "\u2708"))
				airfieldIcon1.setColor(data.countries[airfield.country].color)

				airfieldIcon1.Coalitions = mission.coalitions
				airfieldIcon2.Coalitions = mission.coalitions

				airfieldIcon1.addTarget(airfieldIcon2)
			}

			// Mark airfield to be enabled/activated for taxi
			if (!airfield.offmap && airfield.value && airfield.taxi) {
				airfieldsTaxi.add(airfield)
			}

			totalActive++
		}

		// Skip/continue if airfield has no items available
		if (airfield.offmap || !airfieldData.items || !airfieldData.items.length) {
			continue
		}

		// Initialize airfield zone using a lazy getter
		addLazyProperty(airfield, "zone", () => mission.createActivityZone({
			group: airfield.group,
			point: [position[0], position[2]],
			radius: AIRFIELD_ZONE_RADIUS
		}))

		// Make airfield item limits
		makeAirfieldLimits.call(mission, airfield)

		// Make airfield vehicle routes
		makeAirfieldRoutes.call(mission, airfield, airfieldData.routes)

		// Walk/process each airfield item
		;(function walkItems(items, isGroup) {

			// Used to delay normal item insertion until any of the special items
			// were included in a group. If no special items are used - all normal
			// items in a group are also not included. This allows to group, for
			// example, an anti-aircraft special item together with a normal decoration
			// item, but if the AA special item is not used - the AA decoration item
			// is also not included.
			const extraItems = []
			let useExtraItems = false

			items.forEach(item => {

				const itemTypeID = item[0]

				// Process item group
				if (Array.isArray(itemTypeID)) {

					rand.shuffle(item)

					if (isGroup) {
						extraItems.push(item)
					}
					else {
						walkItems(item, true)
					}

					return
				}

				let itemObjects = null

				// Normal static item
				if (itemTypeID >= 0) {

					if (isGroup) {
						extraItems.push(item)
					}
					else {
						itemObjects = makeAirfieldStatic.call(mission, airfield, item)
					}
				}
				// Special item
				else {

					// Plane item
					if (itemTypeID === ItemTag.Plane) {
						itemObjects = makeAirfieldPlane.call(mission, airfield, item)
					}
					// Beacon item
					else if (itemTypeID === ItemTag.Beacon) {
						itemObjects = makeAirfieldBeacon.call(mission, airfield, item)
					}
					// Windsock item
					else if (itemTypeID === ItemTag.Windsock) {
						itemObjects = makeAirfieldWindsock.call(mission, airfield, item)
					}
					// Effect item
					else if (itemTypeID === ItemTag.Effect) {
						itemObjects = makeAirfieldEffect.call(mission, airfield, item)
					}
					// Wreck item
					else if (itemTypeID === ItemTag.Wreck) {
						itemObjects = makeAirfieldWreck.call(mission, airfield, item)
					}
					// Vehicle item
					else {
						itemObjects = makeAirfieldVehicle.call(mission, airfield, item)
					}

					// Use all extra normal items in a group if special item is used
					if (itemObjects && itemObjects.length) {
						useExtraItems = true
					}
				}

				// Add generated item objects to airfield group
				if (Array.isArray(itemObjects) && itemObjects.length) {

					itemObjects.forEach(itemObject => {

						if (itemObject instanceof Item) {
							airfield.group.addItem(itemObject)
						}
					})
				}
			})

			// Include extra items
			if (useExtraItems && extraItems.length) {
				walkItems(extraItems, false)
			}

		})(rand.shuffle(airfieldData.items), false)
	}

	// Get max sector plane count by plane size
	function getSectorMaxPlanes(sectorID, planeSizeID) {

		let planeCount = 0

		for (let i = planeSizeID; i <= planeSizeMax; i++) {
			planeCount += airfieldData.sectors[sectorID][i]
		}

		return planeCount
	}

	// Build airfield locations index
	mission.locations.airfields = new Location.Index()
	mission.locations.airfields.load(locationsData)

	// Static airfield data index objects
	mission.airfields = Object.freeze(airfields)
	mission.airfieldsByCoalition = Object.freeze(airfieldsByCoalition)
	mission.offmapSpotsByCoalition = Object.freeze(offmapSpotsByCoalition)

	// Enable not used taxi routes for all active airfields
	// NOTE: When the flights are created they will enable taxi routes that match
	// parking spots of the planes. The code below makes sure to enable the remaining
	// taxi routes for all active airfields that were not activated by flights.
	mission.make.push(() => {

		const playerFlight = this.player.flight

		for (const airfield of airfieldsTaxi) {

			// Choose taxi routes randomly
			const taxiRoutes = rand.shuffle(Object.keys(airfield.taxi))

			for (const taxiRouteID of taxiRoutes) {

				const taxiRunwayID = airfield.taxi[taxiRouteID][1]

				// Enable one random taxi route for each runway
				if (!airfield.activeTaxiRoutes || !airfield.activeTaxiRoutes[taxiRunwayID]) {

					// FIXME: Nearest airfield item is used with takeoff command and this
					// could result in wrong taxi route being activated when player flight
					// is starting from runway and not from parking spot. An ideal fix
					// would be to move player created airfield taxi route to the runway.
					if (airfield.id === playerFlight.airfield &&
							playerFlight.state === FlightState.Runway) {

						break
					}

					makeAirfieldTaxi.call(mission, airfield, +taxiRouteID)
				}
			}
		}
	})

	// Log mission airfields info
	log.I("Airfields:", totalAirfields, {
		offmap: totalOffmap,
		active: totalActive
	})
}