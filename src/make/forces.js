import log from "../log"
import makeFlight from "./flight"
import makePlayerForce from "./forces.player"
import makeAIForces from "./forces.ai"

// Generate mission task forces
export default function makeForces() {

	// Statistics data
	this.totalForces = 0
	this.totalFlights = 0
	this.totalPlanes = 0
	this.totalEntities = 0

	// A map used to track number of unit planes suspended due to failed flight
	// creation (as a result of not enough planes to make a formation for example).
	// This map is updated when flights are finished.
	this.suspendedUnits = Object.create(null)

	// A set used to track airfields that have active local flights. This is used
	// to limit local flights to max 1 flight per airfield at the same time. This
	// set is updated when flights are finished.
	this.activeLocalFlightAirfields = new Set()

	// Make player force
	makePlayerForce.call(this)

	// Make AI forces
	makeAIForces.call(this)

	// Log mission forces info
	log.I("Forces:", this.totalForces, {
		flights: this.totalFlights,
		planes: this.totalPlanes,
		entities: this.totalEntities
	})
}

// Make a new task force
export function makeForce({player = false, choice = {}, state = 0, virtual = false}) {

	const {rand, availableUnits, suspendedUnits, activeLocalFlightAirfields} = this
	const force = []

	let flight

	// Try to create a valid flight
	do {

		const unit = chooseFlightUnit.call(this, choice)
		const flightParams = {
			player,
			virtual,
			state
		}

		if (choice.task) {

			// Find matching unit task choice
			for (const task of rand.shuffle(unit.tasks)) {

				if (choice.task.has(task.id)) {

					flightParams.task = task.id
					break
				}
			}
		}
		// Force a limit of one local flight per airfield
		else if (activeLocalFlightAirfields.has(unit.airfield)) {

			const nonLocalTasks = unit.tasks.filter(task => !task.local)

			// Try another unit
			if (!nonLocalTasks.length) {
				continue
			}

			flightParams.task = rand.pick(nonLocalTasks).id
		}

		flightParams.unit = unit.id

		try {
			flight = makeFlight.call(this, flightParams)
		}
		catch (error) {

			// NOTE: Since we can't make a valid flight with this unit right now (due
			// to missing planes for a proper formation for example) - we have to
			// suspend it temporary (until any other flight from this unit is
			// finished and the planes are returned back to inventory).
			if (Array.isArray(error)) {

				const unitID = unit.id
				let unitIndex = 0
				suspendedUnits[unitID] = 0

				for (;;) {

					unitIndex = availableUnits.indexOf(unitID, unitIndex)

					if (unitIndex === -1) {
						break
					}

					suspendedUnits[unitID]++
					availableUnits.splice(unitIndex, 1)
				}

				log.W.apply(log, error)
			}
			else {
				throw error
			}
		}
	}
	while (!flight)

	// Adjust weighted available units list
	let unitIndex = 0
	let removeItemsCount = flight.planes

	while (removeItemsCount > 0) {

		unitIndex = availableUnits.indexOf(flight.unit, unitIndex)

		if (unitIndex === -1) {
			break
		}

		availableUnits.splice(unitIndex, 1)
		removeItemsCount--
	}

	// Mark airfields with local flights/tasks
	if (!player && flight.task.local) {
		activeLocalFlightAirfields.add(flight.airfield)
	}

	// Update statistics data
	this.totalForces++
	this.totalFlights++
	this.totalPlanes += flight.planes
	this.totalEntities += flight.planes

	// Add flight to task force
	force.push(flight)

	return force
}

// Choose a valid flight unit based on choice data
function chooseFlightUnit(choice) {

	const {rand, availableUnits} = this

	if (!availableUnits.length) {
		return
	}

	const validUnits = new Set()

	// Filter all valid units
	for (const unitID in this.units) {

		// Filter out not matching unit IDs
		if (choice.unit && !choice.unit.has(unitID)) {
			continue
		}

		const unit = this.units[unitID]

		// Filter out unit groups
		if (Array.isArray(unit)) {
			continue
		}

		// Filter out units without tasks
		if (!unit.tasks.length) {
			continue
		}

		// Filter out not matching countries
		if (choice.country && !choice.country.has(unit.country)) {
			continue
		}

		// Filter out not matching airfields
		if (choice.airfield && !choice.airfield.has(unit.airfield)) {
			continue
		}

		// Allow only units with matching tasks
		if (choice.task) {

			let hasValidTask = false

			for (const task of unit.tasks) {

				if (choice.task.has(task.id)) {

					hasValidTask = true
					break
				}
			}

			if (!hasValidTask) {
				continue
			}
		}

		// Allow only units with matching planes
		if (choice.plane) {

			let hasValidPlane = false

			for (const planeID of unit.planes) {

				if (choice.plane.has(planeID)) {

					hasValidPlane = true
					break
				}
			}

			if (!hasValidPlane) {
				continue
			}
		}

		validUnits.add(unitID)
	}

	if (!validUnits.size) {
		return
	}

	// Select a matching unit (from a weighted list)
	// FIXME: Make a more efficient selection (not filtering weighted unit list)
	return this.units[rand.pick(
		availableUnits.filter(unitID => validUnits.has(unitID))
	)]
}