import {FlightState} from "./flight"

// Minimum percent of plane fuel that is always available
const MIN_PLANE_FUEL = 0.1 // 10%

// Make flight fuel
export default function makeFlightFuel(flight, travelDistance = 0) {

	const simulateTakeoff = !travelDistance

	for (const element of flight.elements) {

		let takeoffTime = 0

		// Extra time used for taxi/takeoff
		if (simulateTakeoff) {

			// 8 minutes for air start
			if (typeof element.state === "number") {
				takeoffTime = 8
			}
			// 5 minutes for runway start
			else if (element.state === FlightState.Runway) {
				takeoffTime = 5
			}
			// 1 minute for taxi start
			else if (element.state === FlightState.Taxi) {
				takeoffTime = 1
			}
		}

		// Apply fuel usage for each plane
		for (const plane of element) {

			const {range, speed} = this.planes[plane.plane]
			let remainingFuel = plane.item.Fuel

			// Use fuel based on virtual travel distance and max plane range
			let usedFuel = (travelDistance / 1000) / range

			// Simulate extra fuel used for taxi/takeoff
			if (takeoffTime) {
				usedFuel += (speed / 60 * takeoffTime / range)
			}

			// Apply new fuel value
			remainingFuel = Math.max(remainingFuel - usedFuel, MIN_PLANE_FUEL)

			// NOTE: Need to round fuel value to two decimal digits to prevent game
			// UI bug (display of the "Restore from mission settings" button).
			plane.item.Fuel = Number(remainingFuel.toFixed(2))
		}
	}
}
