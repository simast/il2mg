/** @copyright Simas Toleikis, 2016 */

import data from "../data"
import {makeActivity} from "./flight.plan"

const {activityType} = data

// Make mission free flight task
export default function makeTaskFree(flight) {

	const {rand} = this

	flight.plan.push(makeActivity.call(this, flight, {
		type: activityType.WAIT,
		time: Math.round(rand.real(15, 30) * 60) // 15-30 minutes
	}))
}