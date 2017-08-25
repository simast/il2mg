/** @copyright Simas Toleikis, 2016 */

import {makeActivity, ActivityType} from "./flight.plan"

// Make mission free flight task
export default function makeTaskFree(flight) {

	const {rand} = this

	flight.plan.push(makeActivity.call(this, flight, {
		type: ActivityType.Wait,
		time: Math.round(rand.real(15, 30) * 60) // 15-30 minutes
	}))
}