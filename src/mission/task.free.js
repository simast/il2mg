import {makeActivity, ActivityType} from './flight.plan'
import {markMapArea} from './map'

// Make mission free flight task
export default function makeTaskFree(flight) {

	const {rand} = this
	const airfield = this.airfields[flight.airfield]

	flight.plan.push(makeActivity.call(this, flight, {
		type: ActivityType.Wait,
		time: Math.round(rand.real(15, 30) * 60) // 15-30 minutes
	}))

	if (flight.player && !airfield.offmap) {

		// Draw free flight area zone
		markMapArea.call(this, flight, {
			position: airfield.position
		})
	}
}
