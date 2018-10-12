import makeFlightTime from './flight.time'

// Make flight state
export default function makeFlightState(flight) {

	// Process only flights with a valid state
	if (typeof flight.state !== 'number') {
		return
	}

	let pendingTime = flight.time * flight.state

	if (pendingTime <= 0) {
		return
	}

	// Process state activities
	for (const activity of flight.plan) {

		if (activity.time === undefined) {
			continue
		}

		const stateTime = Math.min(pendingTime, activity.time)

		makeActivityState.call(this, activity, stateTime)

		pendingTime -= stateTime

		if (pendingTime <= 0) {
			break
		}
	}

	// Update flight time
	makeFlightTime.call(this, flight)
}

// Make flight plan activity state
export function makeActivityState(activity, time) {

	const activityTime = activity.time - time

	if (activity.makeState) {
		activity.makeState(time)
	}

	if (activityTime <= 0) {
		delete activity.time
	}
	else {
		activity.time = activityTime
	}
}
