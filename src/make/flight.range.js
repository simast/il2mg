// Make flight max range
export default function makeFlightRange(flight) {

	let maxRange

	// TODO: Payloads should affect max range

	for (const element of flight.elements) {
		for (const {plane} of element) {

			const planeData = this.planes[plane]

			if (maxRange === undefined) {
				maxRange = planeData.range
			}
			else {
				maxRange = Math.min(planeData.range, maxRange)
			}
		}
	}

	flight.range = maxRange * 1000 // In meters
}