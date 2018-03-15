import moment from "moment"
import suncalc from "suncalc"
import data from "../data"
import log from "../log"

// Main period time lengths
const TIME_DAWN = data.time.dawn.period
const TIME_SUNRISE = data.time.sunrise.period
const TIME_NOON = data.time.noon.period
const TIME_SUNSET = data.time.sunset.period
const TIME_DUSK = data.time.dusk.period
const TIME_MIDNIGHT = data.time.midnight.period

// Generate mission time
export default function makeTime() {

	const date = this.date.startOf("day")
	const {rand, map} = this

	// Get sun times data
	const sunTimes = suncalc.getTimes(date.toDate(), map.latitude, map.longitude)

	// NOTE: SunCalc will calculate sun times for local time. We have to modify
	// that time to match defined UTC offset for selected battle map.

	// Sunrise time objects
	const sunrise = this.sunrise = moment(date)
	const sunriseTime = moment(sunTimes.sunrise).utcOffset(map.utcOffset)

	sunrise.set({
		hour: sunriseTime.hour(),
		minute: sunriseTime.minute()
	})

	const sunriseStart = moment(sunrise).subtract(TIME_SUNRISE / 2, "s")
	const sunriseEnd = moment(sunrise).add(TIME_SUNRISE / 2, "s")

	// Noon time objects
	const noon = this.noon = moment(date)
	const noonTime = moment(sunTimes.solarNoon).utcOffset(map.utcOffset)

	noon.set({
		hour: noonTime.hour(),
		minute: noonTime.minute()
	})

	const noonStart = moment(noon).subtract(TIME_NOON / 2, "s")
	const noonEnd = moment(noon).add(TIME_NOON / 2, "s")

	// Sunset time objects
	const sunset = this.sunset = moment(date)
	const sunsetTime = moment(sunTimes.sunsetStart).utcOffset(map.utcOffset)

	// NOTE: In-game sunset start time is off by around 30 minutes from SunCalc results
	sunsetTime.subtract(30, "minutes")

	sunset.set({
		hour: sunsetTime.hour(),
		minute: sunsetTime.minute()
	})

	const sunsetStart = moment(sunset).subtract(TIME_SUNSET / 2, "s")
	const sunsetEnd = moment(sunset).add(TIME_SUNSET / 2, "s")

	// Midnight time objects
	const midnight = this.midnight = moment(noon).subtract(12, "h")
	const midnightStart = moment(midnight).subtract(TIME_MIDNIGHT / 2, "s")
	const midnightEnd = moment(midnight).add(TIME_MIDNIGHT / 2, "s")

	// Other time objects
	const dawnStart = moment(sunriseStart).subtract(TIME_DAWN, "s")
	const duskEnd = moment(sunsetEnd).add(TIME_DUSK, "s")
	const eveningStart = moment(noonEnd).add(sunsetEnd.diff(noonEnd) / 2, "ms")

	let time = this.params.time

	// Generate a random time period
	if (!time) {

		const weightedPeriods = []

		// Build a weighted period array
		for (const periodID in data.time) {

			const period = data.time[periodID]

			if (period.weight) {

				for (let i = 0; i < period.weight; i++) {
					weightedPeriods.push(periodID)
				}
			}
		}

		// Select random period from weighted array
		time = rand.pick(weightedPeriods)
	}

	// Generate time from a named time period
	if (typeof time === "string") {

		const randValue = rand.real(0, 1)

		switch (time) {

			// Dawn (from night to sunrise)
			case "dawn": {

				time = moment(dawnStart)
				time.add(randValue * TIME_DAWN, "s")

				break
			}

			// Sunrise (time around sunrise)
			case "sunrise": {

				time = moment(sunriseStart)
				time.add(randValue * TIME_SUNRISE, "s")

				break
			}

			// Morning (from sunrise to noon)
			case "morning": {

				time = moment(sunriseStart)
				time.add(randValue * noonStart.diff(time), "ms")

				break
			}

			// Day (from sunrise to sunset)
			case "day": {

				time = moment(sunriseStart)
				time.add(randValue * sunsetEnd.diff(time), "ms")

				break
			}

			// Noon (time around solar noon)
			case "noon": {

				time = moment(noonStart)
				time.add(randValue * TIME_NOON, "s")

				break
			}

			// Afternoon (from noon to evening)
			case "afternoon": {

				time = moment(noonEnd)
				time.add(randValue * eveningStart.diff(time), "ms")

				break
			}

			// Evening (from afternoon to night)
			case "evening": {

				time = moment(eveningStart)
				time.add(randValue * duskEnd.diff(time), "ms")

				break
			}

			// Sunset (time around sunset)
			case "sunset": {

				time = moment(sunsetStart)
				time.add(randValue * TIME_SUNSET, "s")

				break
			}

			// Dusk (from sunset to night)
			case "dusk": {

				time = moment(sunsetEnd)
				time.add(randValue * TIME_DUSK, "s")

				break
			}

			// Night (from dusk to dawn)
			case "night": {

				time = moment(duskEnd)
				time.add(randValue * moment(dawnStart)
					.add(1, "d")
					.diff(duskEnd), "ms")

				break
			}

			// Midnight (time around solar midnight)
			case "midnight": {

				time = moment(midnightStart)
				time.add(randValue * TIME_MIDNIGHT, "s")

				break
			}
		}

		// Always set random seconds
		time.second(rand.integer(0, 59))
	}

	// Apply time to mission date object
	date.hour(time.hour())
	date.minute(time.minute())
	date.second(time.second())

	// Set mission time flags
	const timeFlags = this.time = Object.create(null)

	// Dawn flag
	if (date.isSameOrAfter(dawnStart) && date.isBefore(sunriseStart)) {
		timeFlags.dawn = true
	}

	// Sunrise flag
	if (date.isSameOrAfter(sunriseStart) && date.isBefore(sunriseEnd)) {
		timeFlags.sunrise = true
	}

	// Morning flag
	if (date.isSameOrAfter(sunriseStart) && date.isBefore(noonStart)) {
		timeFlags.morning = true
	}

	// Day flag
	if (date.isSameOrAfter(sunriseStart) && date.isBefore(sunsetEnd)) {
		timeFlags.day = true
	}

	// Noon flag
	if (date.isSameOrAfter(noonStart) && date.isBefore(noonEnd)) {
		timeFlags.noon = true
	}

	// Afternoon flag
	if (date.isSameOrAfter(noonEnd) && date.isBefore(eveningStart)) {
		timeFlags.afternoon = true
	}

	// Evening flag
	if (date.isSameOrAfter(eveningStart) && date.isBefore(duskEnd)) {
		timeFlags.evening = true
	}

	// Sunset flag
	if (date.isSameOrAfter(sunsetStart) && date.isBefore(sunsetEnd)) {
		timeFlags.sunset = true
	}

	// Dusk flag
	if (date.isSameOrAfter(sunsetEnd) && date.isBefore(duskEnd)) {
		timeFlags.dusk = true
	}

	// Night flag
	if (date.isSameOrAfter(duskEnd) || date.isBefore(dawnStart)) {
		timeFlags.night = true
	}

	// Midnight flag
	if (date.isSameOrAfter(midnightStart) && date.isBefore(midnightEnd)) {
		timeFlags.midnight = true
	}

	// Set mission options time
	this.items.Options.Time = new String(date.format("H:m:s"))

	// Log mission time info
	let logData = []

	logData.push("Time:")
	logData.push(date.format("HH:mm"))
	logData = logData.concat(Object.keys(timeFlags))

	log.I.apply(log, logData)
}