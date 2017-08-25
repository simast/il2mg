/** @copyright Simas Toleikis, 2016 */

import sylvester from "sylvester"
import * as MCU_Waypoint from "../item/MCU_Waypoint"
import {makeActivity, ActivityType} from "./flight.plan"
import {Location} from "./locations"
import {Territory} from "./fronts"
import {findBasePoints} from "./task.patrol"
import {isRestricted} from "./map"

// Flight make parts
import makeFlightAltitude from "./flight.altitude"
import makeFlightRoute from "./flight.route"

// Max fighter sweep route range restrictions
const MAX_RANGE_FUEL = 75 // 75%
const MAX_RANGE_DISTANCE = 450000 // 450 km

// Min/max angle between two base reference points (in degrees)
const MIN_ANGLE = 25
const MAX_ANGLE = 90

// Min/max distance between two base reference points (in meters)
const MIN_DISTANCE = 15000
const MAX_DISTANCE = 120000

// Make mission fighter sweep task
export default function makeTaskSweep(flight) {

	const {Vector} = sylvester
	const {rand, map} = this
	const airfield = this.airfields[flight.airfield]
	const startX = airfield.position[0]
	const startZ = airfield.position[2]
	const startLocation = new Location(startX, startZ)
	const startVector = startLocation.vector
	const territories = this.locations.territories
	const originVector = Vector.Zero(2)
	const isPlayerFlightLeader = (flight.player === flight.leader)
	const debugFlights = Boolean(this.debug && this.debug.flights)

	// Max fighter sweep route range based on max aircraft fuel range
	const maxPlaneRange = flight.range
	let maxRouteRange = maxPlaneRange * (MAX_RANGE_FUEL / 100)

	// Enforce max fighter sweep route distance
	maxRouteRange = Math.min(maxRouteRange, MAX_RANGE_DISTANCE)

	const maxRouteRangeSegment = Math.round(maxRouteRange / 4)

	// Find base two fighter sweep reference points
	const points = findBasePoints.call(this, flight, {
		start: startLocation,
		maxRange: maxRouteRangeSegment,
		minDistance: MIN_DISTANCE,
		maxDistance: MAX_DISTANCE,
		minAngle: MIN_ANGLE,
		maxAngle: MAX_ANGLE
	})

	// Make a valid point (shifting to valid map area if necessary)
	const makeValidPoint = (pointVector, originVector) => {

		let point = pointVector.elements

		if (!isRestricted(map, point)) {
			return point
		}

		const unitVector = pointVector.subtract(originVector).toUnitVector()
		const stepDistance = 10000 // 10 km
		let stepIndex = 0

		// Find a valid map point by scanning forward and backwards
		while (stepIndex >= 0) {

			stepIndex++

			for (const direction of [-1, +1]) {

				point = unitVector
					.multiply(direction * stepDistance * stepIndex)
					.add(pointVector)
					.elements

				if (!isRestricted(map, point)) {

					stepIndex = -1
					break
				}
			}
		}

		return point
	}

	const sweepPoints = []
	let ingressPoint, ingressVector
	let egressPoint, egressVector
	let rotateDirection = 1
	let sideRatio

	// Step 1: Make base ingress/egress points
	for (let location of rand.shuffle([points.a, points.b])) {

		// Clone and randomize initial location point
		location = new Location(
			rand.integer(location.x1, location.x2),
			rand.integer(location.z1, location.z2)
		)

		let shiftVector = false

		// Use shift vector (with a non-offmap starting position only)
		if (!airfield.offmap &&
			this.getTerritory(location.x, location.z) === Territory.Front) {

			shiftVector = Vector.create([
				location.x - startX,
				location.z - startZ
			]).toUnitVector()

			location = startLocation
		}

		// Constants used for shifting initial ingress/egress points
		const minShiftDistance = 1000 // 1 km
		const maxShiftDistance = 1500 // 1.5 km
		const minFrontDistance = 4000 // 4 km
		const minStartDistance = 10000 // 10 km
		const maxStartDistance = Math.round(maxRouteRangeSegment * 0.5)

		// Find nearest front line following shift vector (from starting location)
		while (shiftVector) {

			const locationVector = location.vector
			const startDistance = locationVector.distanceFrom(startVector)
			const hasMinStartDistance = (startDistance >= minStartDistance)
			const nearestFront = territories[Territory.Front].findNear(location, 1)

			// Make sure ingress/egress point is some distance away from front lines
			if (hasMinStartDistance && nearestFront.length &&
				locationVector.distanceFrom(nearestFront[0].vector) <= minFrontDistance) {

				break
			}

			// Shift point forwards
			const pointVector = locationVector.add(
				shiftVector.multiply(rand.integer(minShiftDistance, maxShiftDistance))
			)

			const posX = pointVector.e(1)
			const posZ = pointVector.e(2)
			const shiftTerritory = this.getTerritory(posX, posZ)

			// End shift when we reach front lines or max distance from start position
			if (shiftTerritory === Territory.Unknown ||
					(hasMinStartDistance && shiftTerritory !== flight.coalition) ||
					(startDistance >= maxStartDistance)) {

				break
			}

			location = new Location(posX, posZ)
		}

		const pointX = location.x
		const pointZ = location.z
		const point = [pointX, pointZ]
		const pointVector = Vector.create([
			pointX - startX,
			pointZ - startZ
		])

		if (!ingressPoint) {

			ingressPoint = point
			ingressVector = pointVector.toUnitVector()
		}
		else {

			egressPoint = point
			egressVector = pointVector.toUnitVector()
		}
	}

	// Step 2: Make the middle (distance) point
	{
		let pointVector = Vector.create([
			ingressPoint[0] - startX,
			ingressPoint[1] - startZ
		])

		const pointDistance = pointVector.modulus()

		let minDistance = Math.round(maxRouteRangeSegment * 1.0)
		let maxDistance = Math.round(maxRouteRangeSegment * 1.5)

		// Adjusted middle point logic for extended routes (from offmap airfields)
		if (maxRouteRangeSegment - pointDistance <= 0) {

			minDistance = Math.round(pointDistance)
			maxDistance = Math.round(pointDistance + maxRouteRangeSegment * 0.5)
		}

		// Set random middle point distance (from the starting position)
		pointVector = pointVector.toUnitVector().multiply(rand.integer(
			minDistance,
			maxDistance
		))

		// Translate middle point vector back to the world coordinate origin
		pointVector = startVector.add(pointVector)

		// Rotate middle point vector
		const rotateAngle = ingressVector.angleFrom(egressVector)
		const rotateAngleMin = rotateAngle / 3
		const rotateAngleMax = rotateAngleMin * 2
		const rotateCheck = ingressVector.rotate(rotateAngle, originVector)

		rotateDirection = rotateCheck.eql(egressVector) ? 1 : -1

		pointVector = pointVector.rotate(
			rotateDirection * rand.real(rotateAngleMin, rotateAngleMax, true),
			startVector
		)

		const point = makeValidPoint(pointVector, startVector)
		const distance = Vector.create(point).distanceFrom(startVector)

		// Set side point ratio based on middle point distance
		sideRatio = (distance - minDistance) / (maxDistance - minDistance)
		sideRatio = 1 - Math.max(sideRatio, 0)

		// Register middle point
		sweepPoints.push(point)
	}

	// Step 3: Make the fourth (side) point
	{
		const middlePoint = sweepPoints[0]
		const enemyCoalition = this.getEnemyCoalition(flight.coalition)
		const results = {
			weighted: []
		}

		// Scan each side and build a weighted list of fourth point directions
		for (const basePoint of [ingressPoint, egressPoint]) {

			const result = Object.create(null)
			const isIngress = (basePoint === ingressPoint)
			const rotation = isIngress ? -1 : 1
			const baseVector = Vector.create([basePoint[0], basePoint[1]])

			if (isIngress) {
				results.ingress = result
			}
			else {
				results.egress = result
			}

			// Use the center of base and middle points
			let sideVector = Vector.create([
				middlePoint[0] - basePoint[0],
				middlePoint[1] - basePoint[1]
			]).multiply(0.5)

			// Perpendicular direction vector (rotated 90 degrees to the outer side)
			const directionVector = sideVector.toUnitVector().rotate(
				rotation * rotateDirection * Math.PI / 2,
				originVector
			)

			result.directionVector = directionVector
			result.sideVector = sideVector = baseVector.add(sideVector)

			const scanDistance = 10000 // 10 km
			let scanIteration = 1
			let scanTerritory

			// Scan side for enemy territories
			do {

				const scanVector = sideVector.add(
					directionVector.multiply(scanIteration * scanDistance)
				)

				const posX = scanVector.e(1)
				const posZ = scanVector.e(2)

				scanTerritory = this.getTerritory(posX, posZ)

				// Found enemy territory over the scan direction
				if (scanTerritory === enemyCoalition) {
					results.weighted.push(result)
				}

				scanIteration++
			}
			while (scanTerritory !== Territory.Unknown)
		}

		let side

		// Pick random/valid side for the fourth point
		if (!results.weighted.length) {
			side = rand.pick([results.ingress, results.egress])
		}
		else {
			side = rand.pick(results.weighted)
		}

		const sideRotateMax = (Math.PI / 4) // 45 degrees
		const sideRotate = rand.real(-(sideRotateMax / 2), sideRotateMax / 2, true)
		const maxDistance = Math.round(maxRouteRangeSegment * 0.75)
		const minDistance = Math.round(maxRouteRangeSegment * 0.25)

		// Make fourth side point
		const pointVector = side.sideVector.add(side.directionVector
			.rotate(sideRotate, originVector)
			.multiply(minDistance + ((maxDistance - minDistance) * sideRatio))
		)

		sweepPoints.push(makeValidPoint(pointVector, side.sideVector))
	}

	// Register base two fighter sweep reference points as flight target
	flight.target = sweepPoints.slice()

	// Register ingress/egress points
	sweepPoints.unshift(ingressPoint)
	sweepPoints.push(egressPoint)

	// Make fighter sweep altitude profile
	const altitude = makeFlightAltitude.call(this, flight)

	const route = []
	let fromPosition = airfield.position

	// Build fighter sweep route points
	for (const point of sweepPoints) {

		const options = {altitude}

		// Use solid ingress route line (when player is not flight leader)
		if (point === ingressPoint) {

			options.split = true

			if (!isPlayerFlightLeader || debugFlights) {
				options.solid = true
			}
		}
		// Set waypoints to low priority (for sweep route only)
		else {
			options.priority = MCU_Waypoint.PRIORITY_LOW
		}

		// Plan fighter sweep route for each point
		const spots = makeFlightRoute.call(
			this,
			flight,
			fromPosition,
			point,
			options
		)

		route.push.apply(route, spots)
		fromPosition = spots.pop().position
	}

	// Make final (back to the base) egress route
	const spots =	makeFlightRoute.call(
		this,
		flight,
		fromPosition,
		flight.airfield,
		{
			altitude,
			split: true
		}
	)

	if (spots && spots.length) {
		route.push.apply(route, spots)
	}

	// Add fighter sweep task fly activity
	flight.plan.push(makeActivity.call(this, flight, {
		type: ActivityType.Fly,
		route,
		visible: Boolean(flight.player)
	}))

	// Disable land activity when operating from offmap airfield
	if (airfield.offmap) {
		flight.plan.land = false
	}
}