/** @copyright Simas Toleikis, 2015 */

import data from "../data"

const {activityType} = data

// Make mission flight plan
export default function makeFlightPlan(flight) {

	const plan = flight.plan = []
	const task = flight.task
	const airfield = this.airfields[flight.airfield]

	// Initial start plan activity
	plan.start = plan[plan.push(makeActivity.call(this, flight, {
		type: activityType.START,
		position: airfield.position,
		delay: 0
	})) - 1]

	// Take off plan activity
	if (typeof flight.state !== "number") {
		plan.push(makeActivity.call(this, flight, {type: activityType.TAKEOFF}))
	}

	// Form up plan activity
	plan.push(makeActivity.call(this, flight, {type: activityType.FORM}))

	// Make task specific plan
	require("./task." + task.id).default.call(this, flight)

	// Land plan activity
	if (plan.land === undefined) {

		plan.land = plan[plan.push(makeActivity.call(this, flight, {
			type: activityType.LAND
		})) - 1]
	}
}

// Utility/factory function used to create flight plan activities
export function makeActivity(flight, params = {}) {

	let activity = {}

	// Create a common activity type/class
	if (params.type) {
		activity = new (require("./activity." + params.type).default)()
	}

	// Set activity params
	Object.assign(activity, params)
	Object.defineProperty(activity, "mission", {value: this})
	Object.defineProperty(activity, "flight", {value: flight})

	return activity
}