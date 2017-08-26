/** @copyright Simas Toleikis, 2015 */

import * as Plane from "../item/Plane"
import {ItemFlag} from "../data"
import {getPlaneSizeFromName} from "./planes"
import {FlightState} from "./flight"
import makeAirfieldTaxi from "./airfield.taxi"

// Make mission flight plane item objects
export default function makeFlightPlanes(flight) {

	// TODO: Set payload
	// TODO: Set weapon mods

	const rand = this.rand
	const airfield = this.airfields[flight.airfield]
	const unit = this.units[flight.unit]
	const usedParkSpawns = []
	let planeNumber = flight.planes

	// NOTE: Randomize taxi spawns list as it's not fully randomized by this point
	// (due to groups usage in airfield data files).
	if (flight.spawns && flight.state === FlightState.Start) {
		rand.shuffle(flight.spawns)
	}

	// Process each flight element (section) in reverse
	for (let elementIndex = flight.elements.length - 1; elementIndex >= 0; elementIndex--) {

		const element = flight.elements[elementIndex]

		// Skip leader only (first plane) when mapping formation number based on distance
		let sortSkip = 0

		// Enforce a limit of one element per ramp or runway start and make sure the
		// player element is always selected for ramp/runway start.
		if ((!flight.player && elementIndex > 0) || (flight.player && !element.player)) {

			// Only one element can start on the ramp from "start" flight state
			if (element.state === FlightState.Start) {
				element.state = FlightState.Taxi
			}
			// Only one element can start on the runway from "runway" flight state
			else if (element.state === FlightState.Runway) {
				element.state = 0 // Air start
			}
		}

		// Process each plane in reverse
		for (let planeIndex = element.length - 1; planeIndex >= 0; planeIndex--) {

			const plane = element[planeIndex]
			const planeData = this.planes[plane.plane]
			const isPlayer = (plane === flight.player)
			const lastPlane = element[planeIndex + 1]
			const isLeader = (planeIndex === 0)
			const validParkSpawns = []
			let foundSpawnPoint = false
			let foundStaticPlane = false
			const pilot = plane.pilot
			const planeItem = plane.item = flight.group.createItem("Plane")
			let positionX
			let positionY
			let positionZ
			let orientation
			let positionOffset
			let orientationRad

			// Try to start plane from parking/ramp
			if (element.state === FlightState.Start) {

				// Build a list of valid taxi spawn points
				if (flight.spawns) {

					const planeSize = getPlaneSizeFromName(planeData.size)

					flight.spawns.forEach((spawnPoint, spawnIndex) => {

						const spawnID = spawnIndex + 1

						if (usedParkSpawns.indexOf(spawnID) === -1 && spawnPoint.size >= planeSize) {

							let distance = 0

							// Compute spawn point distance to last plane item position
							if (flight.elements.length > 1 && lastPlane) {

								const posXDiff = lastPlane.item.XPos - spawnPoint.position[0]
								const posZDiff = lastPlane.item.ZPos - spawnPoint.position[2]

								distance = Math.sqrt(Math.pow(posXDiff, 2) + Math.pow(posZDiff, 2))
							}

							validParkSpawns.push({
								id: spawnID,
								point: spawnPoint,
								distance: distance
							})
						}
					})

					if (element.length > 1) {

						// Sort valid spawn points based on the distance to the last plane in a
						// multi element formation. This helps when placing multiple elements on
						// the same ramp as they will be grouped together and the flight formation
						// will not be mixed up.
						if (flight.elements.length > 1 && lastPlane) {
							validParkSpawns.sort((a, b) => a.distance - b.distance)
						}
						// When placing a first plane on the ramp - sort valid spawn points by
						// size (the first plane will use best fit spawn point).
						else if (!lastPlane) {
							validParkSpawns.sort((a, b) => a.point.size - b.point.size)
						}
					}
				}

				// Try to use any of the valid parking spawn points
				const parkSpawn = validParkSpawns.shift()

				// Use ramp/parking spawn point
				if (parkSpawn) {

					const spawnPoint = parkSpawn.point
					let positionOffsetMin = 10
					let positionOffsetMax = 20
					const orientationOffset = 15

					// Limit position offset for player-only taxi routes
					if (flight.taxi === 0) {

						positionOffsetMin = 8
						positionOffsetMax = 14
					}
					// Slightly move leader plane position forward to avoid possible AI taxiing issues
					else if (isLeader && flight.planes > 1) {

						positionOffsetMin += 10
						positionOffsetMax += 10
					}

					// Add taxi spawn minimum offset distance
					if (spawnPoint.offset) {

						positionOffsetMin += spawnPoint.offset
						positionOffsetMax += spawnPoint.offset
					}

					positionX = spawnPoint.position[0]
					positionY = spawnPoint.position[1]
					positionZ = spawnPoint.position[2]
					orientation = spawnPoint.orientation

					// Slightly move plane position forward
					positionOffset = rand.real(positionOffsetMin, positionOffsetMax, true)
					orientationRad = orientation * (Math.PI / 180)

					positionX += positionOffset * Math.cos(orientationRad)
					positionZ += positionOffset * Math.sin(orientationRad)

					// Slightly vary/randomize plane orientation
					orientation = orientation + rand.real(-orientationOffset, orientationOffset, true)
					orientation = Math.max((orientation + 360) % 360, 0)

					// TODO: Move around existing static plane items instead of removing them
					if (spawnPoint.plane && spawnPoint.plane.item) {

						spawnPoint.plane.item.remove()
						foundStaticPlane = true

						delete spawnPoint.plane.item
						delete spawnPoint.plane
					}

					// Set plane item parking start position and orientation
					planeItem.setPosition(positionX, positionY, positionZ)
					planeItem.setOrientation(orientation)

					// Mark parking spawn point as used/reserved
					usedParkSpawns.push(parkSpawn.id)
					foundSpawnPoint = true

					// Enable taxi route for selected spawn point (player-only flight)
					if (flight.taxi === 0 && spawnPoint.route &&
							makeAirfieldTaxi.call(this, airfield, spawnPoint.route)) {

						flight.taxi = spawnPoint.route
					}
				}
			}
			// Try to start plane from runway
			else if (element.state === FlightState.Runway) {

				let runwayTaxi = airfield.taxi[flight.taxi]

				// TODO: Pick best runway and taxi route based on runway length and plane size
				if (!runwayTaxi) {

					let runwayTaxiID

					// Use any already active taxi route for runway start
					if (airfield.activeTaxiRoutes) {

						runwayTaxiID = rand.pick(Object.keys(airfield.activeTaxiRoutes))
						runwayTaxiID = airfield.activeTaxiRoutes[runwayTaxiID]
					}
					// Use any random taxi route
					else {

						runwayTaxiID = rand.pick(Object.keys(airfield.taxi))

						// Enable selected airfield taxi route
						makeAirfieldTaxi.call(this, airfield, runwayTaxiID)
					}

					runwayTaxi = airfield.taxi[runwayTaxiID]
					flight.taxi = runwayTaxiID
				}

				if (runwayTaxi) {

					// Set initial plane item runway start position and orientation
					planeItem.setPosition(runwayTaxi.takeoffStart)
					planeItem.setOrientationTo(runwayTaxi.takeoffEnd)

					// Fit multiple planes for the runway start
					if (element.length > 1) {

						positionX = runwayTaxi.takeoffStart[0]
						positionY = runwayTaxi.takeoffStart[1]
						positionZ = runwayTaxi.takeoffStart[2]
						orientation = planeItem.YOri

						// Move plane position forward
						positionOffset = 24 * (element.length - planeIndex - 1)
						orientationRad = orientation * (Math.PI / 180)

						positionX += positionOffset * Math.cos(orientationRad)
						positionZ += positionOffset * Math.sin(orientationRad)

						// Move/alternate plane position to left or right side
						const positionDir = planeIndex % 2
						positionOffset = 14

						// Right position offset
						if (positionDir) {
							orientation += 90
						}
						// Left position offset
						else {
							orientation -= 90
						}

						orientation = Math.max((orientation + 360) % 360, 0)
						orientationRad = orientation * (Math.PI / 180)

						positionX += positionOffset * Math.cos(orientationRad)
						positionZ += positionOffset * Math.sin(orientationRad)

						// Set plane item runway start position
						planeItem.setPosition(positionX, positionY, positionZ)
					}

					positionX = planeItem.XPos
					positionZ = planeItem.ZPos

					// Slightly randomize plane runway spawn position
					positionX += rand.real(-3, 3, true)
					positionZ += rand.real(-3, 3, true)

					// Slightly randomize plane runway spawn orientation
					orientation = planeItem.YOri + rand.real(-5, 5, true)
					orientation = Math.max((orientation + 360) % 360, 0)

					planeItem.setPosition(positionX, planeItem.YPos, positionZ)
					planeItem.setOrientation(orientation)

					foundSpawnPoint = true
				}
			}

			// Use taxi spawn point
			if (!foundSpawnPoint && flight.taxi &&
					(element.state === FlightState.Start || element.state === FlightState.Taxi)) {

				const taxiData = airfield.taxi[flight.taxi]
				const taxiPoints = taxiData[4]
				let taxiPointID = 0

				// Find the last used taxi spawn point ID
				if (usedParkSpawns.length) {

					for (let x = usedParkSpawns.length - 1; x >= 0; x--) {

						if (usedParkSpawns[x] < 0) {

							taxiPointID = Math.abs(usedParkSpawns[x])
							break
						}
					}
				}

				const taxiPoint = taxiPoints[taxiPointID]
				const nextTaxiPoint = taxiPoints[taxiPointID + 1]

				if (taxiPoint && taxiPoint[2] !== ItemFlag.TaxiRunway) {

					positionX = taxiPoint[0]
					positionY = airfield.position[1]
					positionZ = taxiPoint[1]

					// Set plane item taxi start position and orientation
					planeItem.setPosition(positionX, positionY, positionZ)
					planeItem.setOrientationTo(nextTaxiPoint[0], nextTaxiPoint[1])

					// Slightly move plane position backwards (from taxi spawn point)
					const taxiOffsetOrientRad = planeItem.YOri * (Math.PI / 180)
					const taxiOffset = 5 // 5 meters backwards

					positionX -= taxiOffset * Math.cos(taxiOffsetOrientRad)
					positionZ -= taxiOffset * Math.sin(taxiOffsetOrientRad)

					planeItem.setPosition(positionX, positionY, positionZ)

					// Mark taxi spawn point as used/reserved
					usedParkSpawns.push(-(taxiPointID + 1))
					foundSpawnPoint = true

					// Set element state to "taxi"
					element.state = FlightState.Taxi

					// Skip this plane when mapping formation number based on distance
					sortSkip++
				}
			}

			// Spawn in the air above airfield
			if (!foundSpawnPoint) {

				// Force air start to entire element when any of the planes must be spawned
				// in the air (required for the planes in the air to not crash).
				element.state = typeof flight.state === "number" ? flight.state : 0

				// Since the entire element is moved to an air start - free up previously
				// reserved parking and taxi spawn points for other flight elements.
				for (let i = (element.length - 1 - planeIndex); i > 0 && usedParkSpawns.length; i--) {
					usedParkSpawns.pop()
				}

				// Reset formation number sort skip number (to leader only)
				sortSkip = 0
			}

			// Replace matching unit static plane item with a live plane
			// TODO: Handle shedulled flights
			if (!foundStaticPlane && flight.sector && airfield.planeItemsByUnit[unit.id]) {

				const planeItemsByUnit = airfield.planeItemsByUnit[unit.id][flight.sector]

				// FIXME: flight.sector can be other sector (not where unit planes are present)
				if (planeItemsByUnit) {

					for (const staticPlane of planeItemsByUnit) {

						// Select matching (by plane group) static plane item
						if (staticPlane.item && staticPlane.group === planeData.group) {

							staticPlane.item.remove()
							delete staticPlane.item

							break
						}
					}
				}
			}

			// Set plane name as pilot ID for player flight planes only
			// NOTE: Required for the radio message UI to not report distant plane/pilot IDs
			if (flight.player && !isPlayer && pilot.id) {
				planeItem.setName(pilot.id)
			}

			planeItem.setCountry(unit.country)
			planeItem.Script = planeData.script
			planeItem.Model = planeData.model
			planeItem.Callsign = flight.callsign.id

			// Player plane item
			if (plane === flight.player) {
				planeItem.AILevel = Plane.AI_PLAYER
			}
			// AI plane item
			else {
				planeItem.AILevel = pilot.level
			}

			// Set plane skin
			if (planeData.skins && planeData.skins[unit.country]) {

				const skins = planeData.skins[unit.country]
				let skin = null

				// Use player-only skin
				if (isPlayer && skins.player) {
					skin = rand.pick(skins.player)
				}
				// Select a random skin from valid/weighted skin list
				else {
					skin = rand.pick(skins)
				}

				// Set custom plane skin
				if (skin && skin.length) {
					planeItem.Skin = skin
				}
			}

			// Create plane entity
			planeItem.createEntity(flight.virtual)
		}

		// Sort subordinate planes in an element formation on the ground based on
		// the distance to the leader plane (will avoid taxi issues).
		if (element.length > 2 && typeof element.state !== "number") {

			// Sort reference plane (either element leader or the last on the taxi way)
			let sortPlane

			// Skip only leader when sorting
			if (sortSkip === 0) {
				sortSkip = 1
			}

			element.forEach((plane, planeIndex) => {

				plane.distance = (planeIndex - sortSkip)

				// Ignore leader plane and planes on the taxi way
				if (plane.distance < 0) {
					sortPlane = plane
				}
				// Compute plane distance to sort reference plane
				else {

					const posXDiff = sortPlane.item.XPos - plane.item.XPos
					const posZDiff = sortPlane.item.ZPos - plane.item.ZPos

					plane.distance = Math.sqrt(Math.pow(posXDiff, 2) + Math.pow(posZDiff, 2))
				}
			})

			element.sort((a, b) => a.distance - b.distance)
		}

		for (let planeIndex = element.length - 1; planeIndex >= 0; planeIndex--) {

			const plane = element[planeIndex]
			const planeItem = plane.item
			const leaderPlane = element[0]
			const isPlayer = (plane === flight.player)
			const isLeader = (plane === leaderPlane)

			// Group subordinate planes with element leader
			if (element.length > 1 && planeIndex > 0) {
				planeItem.entity.addTarget(leaderPlane.item.entity)
			}

			// Set plane number and formation index
			if (flight.planes > 1) {

				planeItem.NumberInFormation = planeIndex
				planeItem.Callnum = planeNumber
				plane.number = planeNumber

				planeNumber--
			}

			// Parking start, engine not running
			if (element.state === FlightState.Start) {

				planeItem.StartInAir = Plane.START_PARKING

				// 50% chance to start with engine running for non-leader and non-player planes
				if (!isPlayer && !isLeader && rand.bool(0.5)) {
					planeItem.StartInAir = Plane.START_RUNWAY
				}
			}
			// Ready, taxi or runway start with engine running
			else if (typeof element.state === "string") {
				planeItem.StartInAir = Plane.START_RUNWAY
			}
			// Air start
			else {
				planeItem.StartInAir = Plane.START_AIR
			}
		}
	}

	delete flight.spawns
}