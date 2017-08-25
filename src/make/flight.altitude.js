/** @copyright Simas Toleikis, 2016 */

// Altitude level types
export const AltitudeLevel = Object.freeze({
	Low: "low",
	Medium: "medium",
	High: "high"
})

// Valid altitude ranges (in meters)
const altitudeRange = {
	[AltitudeLevel.Low]: [300, 1400],
	[AltitudeLevel.Medium]: [1400, 2900],
	[AltitudeLevel.High]: [2900, 5000]
}

// Make flight altitude profile
export default function makeFlightAltitude(flight) {

	const rand = this.rand
	const clouds = this.weather.clouds
	const altitude = {}
	const planeAltitude = this.planes[flight.leader.plane].altitude
	let taskAltitude = flight.task.altitude

	if (!taskAltitude) {

		taskAltitude = {}

		// Default task altitude levels and weights
		for (const altitudeLevel in altitudeRange) {
			taskAltitude[altitudeLevel] = 1
		}
	}

	// Pick altitude level based on plane preference
	if (planeAltitude) {

		const planeAltitudes = []

		// Build a weighted plane altitude level list
		for (const altitudeLevel in planeAltitude) {
			for (let i = 0; i < planeAltitude[altitudeLevel]; i++) {
				planeAltitudes.push(altitudeLevel)
			}
		}

		altitude.level = rand.pick(planeAltitudes)

		// Make sure plane based altitude type is supported by task
		if (!taskAltitude[altitude.level]) {

			let altitudeOptions

			// Altitude level upgrade
			if (altitude.level === AltitudeLevel.Low) {
				altitudeOptions = [AltitudeLevel.Medium, AltitudeLevel.High]
			}
			// Altitude level downgrade
			else if (altitude.level === AltitudeLevel.High) {
				altitudeOptions = [AltitudeLevel.Medium, AltitudeLevel.Low]
			}
			// Random altitude level upgrade or downgrade
			else {
				altitudeOptions = rand.shuffle([AltitudeLevel.Low, AltitudeLevel.High])
			}

			delete altitude.level

			// Change altitude level to match closest task data
			for (const altitudeLevel of altitudeOptions) {

				if (taskAltitude[altitudeLevel]) {

					altitude.level = altitudeLevel
					break
				}
			}
		}
	}

	// Pick a random weighted altitude level from task data
	if (!altitude.level) {

		const taskAltitudes = []

		// Build a weighted task altitude type list
		for (const altitudeLevel in taskAltitude) {
			for (let i = 0; i < taskAltitude[altitudeLevel]; i++) {
				taskAltitudes.push(altitudeLevel)
			}
		}

		altitude.level = rand.pick(taskAltitudes)
	}

	[altitude.min, altitude.max] = altitudeRange[altitude.level]

	// Try to avoid clouds (with over 20% cover)
	if (clouds.cover > 20) {

		// NOTE: Using -100 and +200 meters as a buffer between cloud layer
		const cloudsMin = clouds.altitude - 100
		const cloudsMax = clouds.altitude + clouds.thickness + 200

		if (altitude.min < cloudsMax && altitude.max > cloudsMin) {

			const altitudeOptions = []

			// Below the clouds
			if (altitude.min < cloudsMin) {
				altitudeOptions.push([altitude.min, cloudsMin])
			}

			// Above the clouds
			if (altitude.max > cloudsMax) {
				altitudeOptions.push([cloudsMax, altitude.max])
			}

			// Pick a random altitude based on clouds (above or below)
			if (altitudeOptions.length) {
				[altitude.min, altitude.max] = rand.pick(altitudeOptions)
			}
		}
	}

	// Pick a random altitude target height
	altitude.target = rand.integer(altitude.min, altitude.max)

	return altitude
}