/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../mission").DATA;
var moment = require("moment");

// Main period time lengths
var TIME_DAWN = DATA.time.dawn.period;
var TIME_SUNRISE = DATA.time.sunrise.period;
var TIME_NOON = DATA.time.noon.period;
var TIME_SUNSET = DATA.time.sunset.period;
var TIME_DUSK = DATA.time.dusk.period;
var TIME_MIDNIGHT = DATA.time.midnight.period;

// Generate mission time
module.exports = function(mission) {

	var date = mission.date.startOf("day");
	var time = mission.params.time;
	var sun = mission.battle.sun[date.format("YYYY-MM-DD")];

	// Sunrise time objects
	var sunrise = moment(sun[0], "HH:mm", true);
	var sunriseTime = moment(date).hour(sunrise.hour()).minute(sunrise.minute());
	var sunriseTimeStart = moment(sunriseTime).subtract(TIME_SUNRISE / 2, "s");
	var sunriseTimeEnd = moment(sunriseTime).add(TIME_SUNRISE / 2, "s");

	// Noon time objects
	var noon = moment(sun[1], "HH:mm", true);
	var noonTime = moment(date).hour(noon.hour()).minute(noon.minute());
	var noonTimeStart = moment(noonTime).subtract(TIME_NOON / 2, "s");
	var noonTimeEnd = moment(noonTime).add(TIME_NOON / 2, "s");

	// Sunset time objects
	var sunset = moment(sun[2], "HH:mm", true);
	var sunsetTime = moment(date).hour(sunset.hour()).minute(sunset.minute());
	var sunsetTimeStart = moment(sunsetTime).subtract(TIME_SUNSET / 2, "s");
	var sunsetTimeEnd = moment(sunsetTime).add(TIME_SUNSET / 2, "s");

	// Midnight time objects
	var midnightTime = moment(noonTime).subtract(12, "h");
	var midnightTimeStart = moment(midnightTime).subtract(TIME_MIDNIGHT / 2, "s");
	var midnightTimeEnd = moment(midnightTime).add(TIME_MIDNIGHT / 2, "s");

	// Other time objects
	var dawnTimeStart = moment(sunriseTimeStart).subtract(TIME_DAWN, "s");
	var duskTimeEnd = moment(sunsetTimeEnd).add(TIME_DUSK, "s");
	var eveningTimeStart = moment(noonTimeEnd).add(duskTimeEnd.diff(noonTimeEnd) / 2, "ms");

	// Generate a random time period
	if (!time) {

		var weightedPeriods = [];

		// Build a weighted period array
		for (var periodID in DATA.time) {

			var period = DATA.time[periodID];

			if (period.weight) {

				for (var i = 0; i < period.weight; i++) {
					weightedPeriods.push(periodID);
				}
			}
		}

		// Select random period from weighted array
		time = weightedPeriods[Math.floor(Math.random() * weightedPeriods.length)];
	}

	// Generate time from a named time period
	if (typeof time === "string") {

		switch (time) {

			// Dawn (from night to sunrise)
			case "dawn": {

				time = moment(dawnTimeStart);
				time.add(Math.random() * TIME_DAWN, "s");

				break;
			}

			// Sunrise (time around sunrise)
			case "sunrise": {

				time = moment(sunriseTimeStart);
				time.add(Math.random() * TIME_SUNRISE, "s");

				break;
			}

			// Morning (from sunrise to noon)
			case "morning": {

				time = moment(sunriseTimeStart);
				time.add(Math.random() * noonTimeStart.diff(time), "ms");

				break;
			}

			// Day (from sunrise to sunset)
			case "day": {

				time = moment(sunriseTimeStart);
				time.add(Math.random() * sunsetTimeEnd.diff(time), "ms");

				break;
			}

			// Noon (time around solar noon)
			case "noon": {

				time = moment(noonTimeStart);
				time.add(Math.random() * TIME_NOON, "s");

				break;
			}

			// Afternoon (from noon to evening)
			case "afternoon": {

				time = moment(noonTimeEnd);
				time.add(Math.random() * eveningTimeStart.diff(time), "ms");

				break;
			}

			// Evening (from afternoon to night)
			case "evening": {

				time = moment(eveningTimeStart);
				time.add(Math.random() * duskTimeEnd.diff(time), "ms");

				break;
			}

			// Sunset (time around sunset)
			case "sunset": {

				time = moment(sunsetTimeStart);
				time.add(Math.random() * TIME_SUNSET, "s");

				break;
			}

			// Dusk (from sunset to night)
			case "dusk": {

				time = moment(sunsetTimeEnd);
				time.add(Math.random() * TIME_DUSK, "s");

				break;
			}

			// Night (from dusk to dawn)
			case "night": {

				time = moment(dawnTimeStart);
				time.subtract(Math.random() * duskTimeEnd.diff(time), "ms");

				break;
			}

			// Midnight (time around solar midnight)
			case "midnight": {

				time = moment(midnightTimeStart);
				time.add(Math.random() * TIME_MIDNIGHT, "s");

				break;
			}
		}

		// Always set random seconds
		time.second(Math.random() * 60);
	}

	// Apply time to mission date object
	date.hour(time.hour());
	date.minute(time.minute());
	date.second(time.second());

	// Set mission time flags
	var timeFlags = mission.time = Object.create(null);

	// Dawn flag
	if (time.isAfter(dawnTimeStart) && time.isBefore(sunriseTimeStart)) {
		timeFlags.dawn = true;
	}

	// Sunrise flag
	if (time.isAfter(sunriseTimeStart) && time.isBefore(sunriseTimeEnd)) {
		timeFlags.sunrise = true;
	}

	// Morning flag
	if (time.isAfter(sunriseTimeStart) && time.isBefore(noonTimeStart)) {
		timeFlags.morning = true;
	}

	// Day flag
	if (time.isAfter(sunriseTimeStart) && time.isBefore(sunsetTimeEnd)) {
		timeFlags.day = true;
	}

	// Noon flag
	if (time.isAfter(noonTimeStart) && time.isBefore(noonTimeEnd)) {
		timeFlags.noon = true;
	}

	// Afternoon flag
	if (time.isAfter(noonTimeEnd) && time.isBefore(eveningTimeStart)) {
		timeFlags.afternoon = true;
	}

	// Evening flag
	if (time.isAfter(eveningTimeStart) && time.isBefore(duskTimeEnd)) {
		timeFlags.evening = true;
	}

	// Sunset flag
	if (time.isAfter(sunsetTimeStart) && time.isBefore(sunsetTimeEnd)) {
		timeFlags.sunset = true;
	}

	// Dusk flag
	if (time.isAfter(sunsetTimeEnd) && time.isBefore(duskTimeEnd)) {
		timeFlags.dusk = true;
	}

	// Night flag
	if (time.isAfter(duskTimeEnd) || time.isBefore(dawnTimeStart)) {
		timeFlags.night = true;
	}

	// Midnight flag
	if (time.isAfter(midnightTimeStart) && time.isBefore(midnightTimeEnd)) {
		timeFlags.midnight = true;
	}

	// Set mission options time
	mission.blocks.Options.Time = new String(date.format("H:m:s"));
};