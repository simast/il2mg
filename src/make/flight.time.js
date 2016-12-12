/** @copyright Simas Toleikis, 2016 */
"use strict";

// Make flight time
module.exports = function makeFlightTime(flight) {

	let time = 0;

	// Sum total flight time from all activities
	for (const activity of flight.plan) {

		if (typeof activity.makeTime !== "function") {
			continue;
		}

		time += activity.makeTime();
	}

	// Set AI "Time" property value for each plane
	for (const element of flight.elements) {
		for (const {item: planeItem} of element) {

			planeItem.Time = Math.round(time / 60);
		}
	}

	flight.time = Math.round(time);
};