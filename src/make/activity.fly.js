import numeral from "numeral"
import sylvester from "sylvester"
import * as MCU_Icon from "../item/MCU_Icon"
import {MapColor} from "./map"
import {AltitudeLevel} from "./flight.altitude"
import makeFlightFuel from "./flight.fuel"
import makeBriefingLead from "./briefing.lead"

// Minimum distance required between start position and the next spot
const MIN_SPOT_DISTANCE = 5000 // 5 Km

// First (intro) plan description segments
const introSegments = [
	"proceed with your mission"
]

// Last (outro) plan description segments
const outroSegments = [
	"keep your eyes open for any enemy contacts"
]

// Plan activity used to fly
export default class ActivityFly {

	// Make fly activity action
	makeAction(element, input) {

		const {mission, flight, route} = this
		const [leaderElement] = flight.elements

		// Process fly action only for leading element
		if (element !== leaderElement) {
			return
		}

		const debugFlights = Boolean(mission.debug && mission.debug.flights)
		const drawIcons = (Boolean(this.visible) || debugFlights) && !flight.lastSpotIcon

		if (!input && !drawIcons) {
			return
		}

		const {rand} = mission
		const flightGroup = flight.group
		const leaderPlaneItem = element[0].item
		let lastWaypoint = null

		// Process each route spot
		for (let i = 0; i < route.length; i++) {

			const spot = route[i]
			const nextSpot = route[i + 1]

			// Create waypoint for spot
			if (input) {

				let waypoint = spot.waypoint

				if (!waypoint) {

					waypoint = flightGroup.createItem("MCU_Waypoint")

					if (spot.priority !== undefined) {
						waypoint.Priority = spot.priority
					}

					waypoint.Speed = spot.speed
					waypoint.Area = rand.integer(750, 1250)
					waypoint.setPosition(spot.position)

					// Connect this waypoint to last waypoint
					if (lastWaypoint) {

						lastWaypoint.addTarget(waypoint)
						lastWaypoint.setOrientationTo(waypoint)
					}

					spot.waypoint = waypoint
				}

				// Connect initial (first) waypoint with previous action
				// TODO: Leading element should wait for other elements
				if (!lastWaypoint) {
					input(waypoint)
				}

				waypoint.addObject(leaderPlaneItem)

				lastWaypoint = waypoint
			}

			const isNextSpotVisible = (nextSpot && !nextSpot.hidden)
			const drawAIRoute = Boolean(!flight.player && debugFlights)

			// Draw flight route on the map
			// NOTE: Only draw icons for visible spots or when the next spot is
			// visible (to allow route line connections).
			if (drawIcons && (!spot.hidden || isNextSpotVisible)) {

				const lastSpotIcon = flight.lastSpotIcon || flight.startIcon
				const spotIcon = flightGroup.createItem("MCU_Icon")
				let routeColor = MapColor.Route

				if (drawAIRoute) {

					if (flight.coalition === mission.player.flight.coalition) {
						routeColor = MapColor.Friend
					}
					else {
						routeColor = MapColor.Enemy
					}
				}

				spotIcon.setPosition(spot.position)
				spotIcon.Coalitions = [flight.coalition]

				if (debugFlights) {
					spotIcon.Coalitions = mission.coalitions
				}

				if (!spot.hidden && !spot.split && isNextSpotVisible && !drawAIRoute) {
					spotIcon.IconId = MCU_Icon.ICON_WAYPOINT
				}

				if (!spot.hidden) {

					lastSpotIcon.addTarget(spotIcon)
					lastSpotIcon.setColor(routeColor)

					// Use normal lines for AI flight routes in debug mode
					if (drawAIRoute) {
						lastSpotIcon.LineType = MCU_Icon.LINE_NORMAL
					}
					// Use solid line
					else if (spot.solid) {
						lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_3
					}
					// Use dashed line
					else {
						lastSpotIcon.LineType = MCU_Icon.LINE_SECTOR_4
					}
				}

				flight.lastSpotIcon = spotIcon
			}
		}

		if (!lastWaypoint) {
			return
		}

		// Connect next plan action with last waypoint
		return input => {
			lastWaypoint.addTarget(input)
		}
	}

	// Make fly activity state
	makeState(time) {

		const {Vector} = sylvester
		const {mission, flight, route} = this
		const {plan} = flight
		const state = time / this.time
		const stateDistance = this.getRouteDistance() * state
		let startPosition = this.position
		let removeActivity = false

		// Fast-forward full fly activity
		if (state >= 1) {

			removeActivity = true
			startPosition = route.pop().position
		}
		// Fast-forward partial fly activity
		else {

			let pendingDistance = stateDistance

			// Process route spots
			for (;;) {

				const [spot] = route
				const spotVector = Vector.create(spot.position)
				const startVector = Vector.create(startPosition)
				const spotDistance = startVector.distanceFrom(spotVector)

				pendingDistance -= spotDistance

				// Skip entire spot
				if (pendingDistance >= 0) {

					route.shift()
					startPosition = spot.position
				}
				// Find new fast-forwarded start position
				else {

					startPosition = startVector.add(
						spotVector
							.subtract(startVector)
							.toUnitVector()
							.multiply(spotDistance + pendingDistance)
					).elements

					// Skip next spot if it's too close to new start position
					if (Math.abs(pendingDistance) < MIN_SPOT_DISTANCE) {
						route.shift()
					}

					// Remove activity
					if (!route.length) {
						removeActivity = true
					}

					break
				}
			}
		}

		// Use flight fuel for fast-forward travel distance
		makeFlightFuel.call(mission, flight, stateDistance)

		// Set new flight start position
		plan.start.position = this.position = startPosition

		// Remove activity from plan
		if (removeActivity) {
			plan.splice(plan.indexOf(this), 1)
		}
	}

	// Make fly activity briefing
	makeBriefing() {

		const {mission, flight} = this
		const {rand} = mission
		const isPlayerFlightLeader = (flight.player === flight.leader)
		const briefing = []

		let joinIntroOutro = false
		let briefingIntro = makeBriefingLead.call(mission, flight)

		// Pick a random intro segment
		if (briefingIntro.length < 2 && isPlayerFlightLeader) {
			briefingIntro.push(rand.pick(introSegments))
		}

		if (!briefingIntro.length === 1) {
			joinIntroOutro = true
		}

		briefingIntro = briefingIntro.join(" and ")

		// Add flight route altitude/speed data
		if (!isPlayerFlightLeader) {

			const briefingRoute = []
			const clouds = mission.weather.clouds
			const {altitude, speed} = this.route[0]
			const altitudeStr = numeral(Math.round(altitude.target / 100) * 100).format("0,0")
			const speedStr = numeral(Math.round(speed / 10) * 10).format("0,0")

			let routeType = "designated"

			// NOTE: Avoiding multiple "flight" references in the same sentence
			if (briefingIntro.indexOf("flight") === -1) {
				routeType += " flight"
			}

			briefingRoute.push("on a " + routeType + " route")

			// Include clouds level reference (for significant cover only)
			if (clouds.cover > 20) {

				const cloudsMin = clouds.altitude
				const cloudsMax = clouds.altitude + clouds.thickness
				let cloudsDelta

				if (altitude.target < cloudsMin) {
					cloudsDelta = altitude.target - cloudsMin
				}
				else if (altitude.target > cloudsMax) {
					cloudsDelta = altitude.target - cloudsMax
				}

				if (cloudsDelta && Math.abs(cloudsDelta) < 600) {

					briefingRoute.push("just")

					if (cloudsDelta > 0) {
						briefingRoute.push("above")
					}
					else {
						briefingRoute.push("below")
					}

					briefingRoute.push("the clouds")
				}
			}

			briefingRoute.push("aiming for")

			if (altitude.level === AltitudeLevel.Low) {
				briefingRoute.push("a low")
			}
			else if (altitude.level === AltitudeLevel.High) {
				briefingRoute.push("a high")
			}

			briefingRoute.push("[" + altitudeStr + " meters]")
			briefingRoute.push("altitude and")
			briefingRoute.push("[" + speedStr + " km/h] speed")

			briefingIntro += " " + briefingRoute.join(" ")
		}

		// Pick a random outro segment
		const briefingOutro = rand.pick(outroSegments)

		if (joinIntroOutro) {
			briefing.push([briefingIntro, briefingOutro].join(" and "))
		}
		else {
			briefing.push(briefingIntro, briefingOutro)
		}

		return briefing.map(value => (
			value.charAt(0).toUpperCase() + value.slice(1)
		)).join(". ") + "."
	}

	// Walk over route (reporting distance for each spot)
	walkRoute(callback) {

		const {Vector} = sylvester
		let prevSpotVector = Vector.create(this.position)

		// Walk each route spot
		for (const spot of this.route) {

			const spotVector = Vector.create(spot.position)

			// Trigger route spot and distance callback
			callback(spot, spotVector.distanceFrom(prevSpotVector))

			prevSpotVector = spotVector
		}
	}

	// Get fly activity route distance
	getRouteDistance() {

		let routeDistance = 0

		// Sum each spot distance
		this.walkRoute((spot, distance) => {
			routeDistance += distance
		})

		return routeDistance
	}

	// Make fly activity time
	makeTime() {

		let time = 0

		// Calculate route time
		this.walkRoute((spot, distance) => {
			time += distance / (spot.speed * 1000 / 3600)
		})

		return time
	}

	// Make virtual route points count
	makeVirtualPoints() {

		// Make sure to cover entire route distance with virtual points
		// FIXME: Use mission complexity setting to generate virtual point count
		return Math.floor(this.getRouteDistance() / 40000)
	}
}