import sylvester from 'sylvester'
import {ActivityType} from './flight.plan'
import * as MCU_CMD_Formation from '../item/MCU_CMD_Formation'

// Minimum and maximum pitch angle (for pose orientation)
const MIN_PITCH_ANGLE = -15
const MAX_PITCH_ANGLE = +15

// Airfield spawn altitude and area radius constraints (in meters)
const AIRFIELD_SPAWN_MIN_ALT = 200
const AIRFIELD_SPAWN_MAX_ALT = 350
const AIRFIELD_SPAWN_RADIUS = 400

// Angle and spacing used for formation/plane positioning
const FORMATION_ANGLE = 30 // Degrees
const FORMATION_SPACING = 100 // Meters

// Make flight air start pose (position and orientation based on formation)
export default function makeFlightPose(flight) {

	const {Vector, Line} = sylvester
	const plan = flight.plan
	const fromPosition = plan.start.position
	const elements = flight.elements
	let toPosition
	let spawnPosition
	let spawnOrientation
	let spawnBackVector
	let spawnUpVector
	let spawnUpLine

	for (let e = 0; e < elements.length; e++) {

		const element = elements[e]

		// Apply pose only to elements with air start
		if (typeof element.state !== 'number') {
			continue
		}

		const rand = this.rand
		const formation = element.formation
		let elementDistance = 0

		// Find initial spawn position
		if (!spawnPosition) {

			spawnPosition = fromPosition
			const airfieldPosition = this.airfields[flight.airfield].position

			// Use a random spawn point above airfield
			if (!spawnPosition || spawnPosition === airfieldPosition) {

				const offsetX = rand.real(-AIRFIELD_SPAWN_RADIUS, AIRFIELD_SPAWN_RADIUS)
				const offsetY = rand.real(AIRFIELD_SPAWN_MIN_ALT, AIRFIELD_SPAWN_MAX_ALT)
				const offsetZ = rand.real(-AIRFIELD_SPAWN_RADIUS, AIRFIELD_SPAWN_RADIUS)

				spawnPosition = [
					airfieldPosition[0] + offsetX,
					airfieldPosition[1] + offsetY,
					airfieldPosition[2] + offsetZ
				]
			}
		}

		// Try to use next route point position (for orientation)
		if (!toPosition && typeof flight.state === 'number') {

			for (const activity of plan) {

				if (activity.type === ActivityType.Fly) {

					toPosition = activity.route[0].position
					break
				}
			}
		}

		// Use a random orientation target position
		if (!toPosition) {

			toPosition = [
				spawnPosition[0] + rand.real(-1, 1, true),
				spawnPosition[1],
				spawnPosition[2] + rand.real(-1, 1, true)
			]
		}

		// Build orientation vector
		if (!spawnOrientation) {

			const diffX = toPosition[0] - spawnPosition[0]
			const diffY = toPosition[1] - spawnPosition[1]
			const diffZ = toPosition[2] - spawnPosition[2]

			let yaw = Math.atan2(diffZ, diffX)
			let pitch = Math.atan2(
				diffY,
				Math.sqrt((diffZ * diffZ) + (diffX * diffX))
			)

			yaw = yaw * (180 / Math.PI)
			pitch = pitch * (180 / Math.PI)

			if (yaw < 0) {
				yaw += 360
			}

			// Apply pitch angle limits
			pitch = Math.max(pitch, MIN_PITCH_ANGLE)
			pitch = Math.min(pitch, MAX_PITCH_ANGLE)

			if (pitch < 0) {
				pitch += 360
			}

			spawnOrientation = [0, yaw, pitch] // Roll, Yaw, Pitch

			// Inverted orientation vector (used for formation positioning)
			spawnBackVector = Vector.create([diffX, diffY, diffZ])
				.toUnitVector()
				.multiply(-1)

			// Build a perpendicular spawn up vector and line
			pitch = (pitch + 90) % 360 * (Math.PI / 180)
			yaw = yaw * (Math.PI / 180)

			spawnUpVector = Vector.create([
				Math.cos(yaw) * Math.cos(pitch),
				Math.sin(pitch),
				Math.sin(yaw) * Math.cos(pitch)
			])

			spawnUpLine = Line.create(Vector.Zero(3), spawnUpVector)
		}

		// Apply air start orientation and position for each plane
		for (let planeIndex = 0; planeIndex < element.length; planeIndex++) {

			const plane = element[planeIndex]
			const isElementLeader = (plane === element[0])
			const planeItem = plane.item
			let position = spawnPosition

			// TODO: Support formation density

			// Set wingman position based on element formation
			if (!isElementLeader) {

				// Default line (none) formation
				let distance = planeIndex * FORMATION_SPACING
				let angle = 0

				// Left edge formation
				if (formation === MCU_CMD_Formation.TYPE_PLANE_EDGE_LEFT) {
					angle = -FORMATION_ANGLE
				}
				// Right edge formation
				else if (formation === MCU_CMD_Formation.TYPE_PLANE_EDGE_RIGHT) {
					angle = FORMATION_ANGLE
				}
				// V formation
				else if (formation === MCU_CMD_Formation.TYPE_PLANE_V) {

					const direction = (planeIndex % 2 === 1) ? -1 : 1

					distance = Math.ceil(planeIndex / 2) * FORMATION_SPACING
					angle = direction * FORMATION_ANGLE
				}

				// Add a small +-10% formation spacing and angle randomness
				const spacingRand = FORMATION_SPACING * 0.1
				const angleRand = FORMATION_ANGLE * 0.1

				distance += rand.real(-spacingRand, spacingRand, true)
				angle += rand.real(-angleRand, angleRand, true)

				const planeVector = spawnBackVector
					.multiply(distance)
					.rotate(angle * (Math.PI / 180), spawnUpLine)
					.add(spawnUpVector.multiply(distance * -0.03))

				position = Vector.create(spawnPosition).add(planeVector).elements
				elementDistance = Math.max(elementDistance, distance)
			}

			planeItem.setOrientation(spawnOrientation)
			planeItem.setPosition(position)
		}

		const isLastElement = (e + 1 === elements.length)

		// Set next element position
		if (!isLastElement) {

			const angleBack = rand.real(-FORMATION_ANGLE, FORMATION_ANGLE, true)
			const distanceRand = FORMATION_SPACING * 0.1
			let distanceBack = elementDistance + (FORMATION_SPACING * 2)
			let distanceUp = FORMATION_SPACING

			// Add a small +- 10% element spacing randomness
			distanceBack += rand.real(-distanceRand, distanceRand, true)
			distanceUp += rand.real(-distanceRand, distanceRand, true)

			const elementVector = spawnBackVector
				.multiply(distanceBack)
				.rotate(angleBack * (Math.PI / 180), spawnUpLine)
				.add(spawnUpVector.multiply(distanceUp))

			spawnPosition = Vector.create(spawnPosition).add(elementVector).elements
		}
	}
}
