import makeFlightFuel from './flight.fuel'

// Plan activity used to do nothing and wait for a specified amount of time
export default class ActivityWait {

	// Make wait activity action
	makeAction(element, input) {

		const {flight} = this

		if (!input) {
			return
		}

		const [leaderElement] = flight.elements

		// Process wait action only for leading element
		if (element !== leaderElement) {
			return
		}

		const leaderPlaneItem = element[0].item

		// Wait using timer command
		const waitTimer = flight.group.createItem('MCU_Timer')

		waitTimer.Time = Number(this.time.toFixed(3))
		waitTimer.setPositionNear(leaderPlaneItem)

		// Connect timer command to previous action
		input(waitTimer)

		// Connect timer command to next action
		return input => {
			waitTimer.addTarget(input)
		}
	}

	// Make wait activity state
	makeState(time) {

		const {mission, flight} = this
		const {plan} = flight

		// Fast-forward wait activity state based on elapsed time
		const planeSpeed = mission.planes[flight.leader.plane].speed
		const waitDistance = time * (planeSpeed * 1000 / 3600)

		// Use flight fuel for fast-forward wait distance
		makeFlightFuel.call(mission, flight, waitDistance)

		// Remove activity from plan
		if (time >= this.time) {
			plan.splice(plan.indexOf(this), 1)
		}
	}
}
