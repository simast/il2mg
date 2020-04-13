import {makeForce} from './forces'

// NOTE: We have to limit max number of plane entities even with virtual flights
// It seems disabled entities still consume a lot of memory and have a significant
// impact on CPU usage.
const PLANE_ENTITIES_MAX_COUNT = 400

// Percent of serviceable planes available for actual flights.
// TODO: Make this configurable per battle, coalition and date
const PLANES_SERVICEABILITY_PERCENT = 0.75 // 75%

// Percent used to limit available planes that are allowed to be in the air at
// the same time. This percent also defines how many planes are in the air and
// in progress when the mission starts.
// TODO: In air percent should not be static but depend on current time (e.g.
// less planes when the time advances to dusk/night)
const PLANES_IN_AIR_PERCENT = 0.25 // 25%

// Make AI task forces
export default function makeAIForces() {

	const {rand, availableUnits} = this
	const activeFlights = []

	const maxPlanesCount = Math.round(availableUnits.length * PLANES_SERVICEABILITY_PERCENT)
	const maxPlanesInAirCount = Math.round(maxPlanesCount * PLANES_IN_AIR_PERCENT)

	// Make initial forces that are in progress and in the air when mission starts
	do {

		const force = makeForce.call(this, {
			state: rand.real(0, 0.75),
			virtual: true
		})

		// Track all AI active flights
		activeFlights.push(...force)
	}
	while (
		this.totalPlanes <= maxPlanesInAirCount &&
		this.totalEntities <= PLANE_ENTITIES_MAX_COUNT
	)
}