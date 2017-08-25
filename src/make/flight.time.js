/** @copyright Simas Toleikis, 2016 */

// Make flight time
export default function makeFlightTime(flight) {

	let time = 0

	// Sum total flight time from all activities
	for (const activity of flight.plan) {

		if (activity.makeTime) {
			activity.time = activity.makeTime()
		}

		if (activity.time === undefined) {
			continue
		}

		time += activity.time
	}

	// Set AI "Time" property value for each plane
	for (const element of flight.elements) {
		for (const {item: planeItem} of element) {

			planeItem.Time = Math.round(time / 60)
		}
	}

	flight.time = time
}