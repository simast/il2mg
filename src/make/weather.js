/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");
const {weatherState, precipitation, season} = data;
const log = require("../log");

// TODO: Move these constants to settings?
const MAX_WIND_SPEED = 13; // Maximum wind speed (m/s)
const MIN_WIND_SPEED = 0.25; // Minimum wind speed (m/s)
const MAX_WIND_CHANGE = 30; // Maximum wind layer direction change (degrees)
const MAX_TURBULENCE = 4; // Maximum turbulence level
const MAX_PRESSURE_CHANGE = 15; // Maximum atmospheric pressure change (mmHg)

// Maximum cloud cover (%)
// NOTE: Extra 10 points is a workaround to make full overcasts more common
const MAX_CLOUD_COVER = 110;

// Maximum wind speed allowed with mist weather effect
const MIST_MAX_WIND_SPEED = 4;

// Maximum weather state points distribution (%)
const weatherPoints = {
	CLOUDS: 40,
	WINDS: 60
};

// Weather state limits
const weatherLimits = {
	[weatherState.PERFECT]: {
		clouds: 10, // Maximum cloud cover (%)
		winds: 2 // Maximum wind speed (m/s)
	},
	[weatherState.GOOD]: {
		clouds: 40,
		winds: 4
	},
	[weatherState.BAD]: {
		clouds: 99,
		winds: 6
	},
	[weatherState.EXTREME]: {
		clouds: MAX_CLOUD_COVER,
		winds: MAX_WIND_SPEED
	}
};

// Compute maximum points for weather state limits
for (const state in weatherLimits) {

	const limits = weatherLimits[state];
	const points = limits.points = {};

	// Dedicate weather state points for cloud cover
	points.clouds = weatherPoints.CLOUDS * (limits.clouds / MAX_CLOUD_COVER);

	// Dedicate weather state points for wind speed
	points.winds = weatherPoints.WINDS * (limits.winds / MAX_WIND_SPEED);

	points.total = points.clouds + points.winds;
}

// Generate mission weather and atmospheric conditions
module.exports = function makeWeather() {

	const rand = this.rand;
	const options = this.items.Options;
	const weather = this.battle.weather[this.date.format("YYYY-MM-DD")];
	let state;

	// Set requested weather condition
	if (this.params.weather) {
		state = this.params.weather;
	}
	// Set weather condition based on historical patterns
	else {

		state = weather[2];

		// TODO: Use some logarithmic curve for picking weather state from interval?
		if (Array.isArray(state)) {
			state = rand.integer(state[0], state[1]);
		}

		// FIXME: By default we don't use extreme weather conditions with historical
		// weather patterns. In the future - make it so larger planes in extreme
		// weather can still try and fly missions.
		if (state === weatherState.EXTREME) {
			state--;
		}
	}

	// Get current state minimum and maximum weather points interval
	const limits = weatherLimits[state];
	const prevLimits = weatherLimits[state - 1];
	const minPoints = prevLimits ? Math.max(prevLimits.points.total, 0) : 0;
	const maxPoints = Math.min(limits.points.total, 100);

	// Pick random weather points number
	const points = rand.real(minPoints, maxPoints, true);

	// Distribute points for clouds and winds by using a shifted interval method
	const pointsOffset = rand.real(0, maxPoints - points, true);
	const cloudPoints = Math.min(Math.max(limits.points.clouds - pointsOffset, 0), points);
	const windPoints = Math.min(Math.max(pointsOffset + points - limits.points.clouds, 0), points);

	// TODO: Adjust weather state based on player plane size

	this.weather = {
		state: state,
		points: {
			clouds: cloudPoints,
			winds: windPoints
		}
	};

	// Level in meters at what point temperature and pressure is measured
	options.TempPressLevel = this.map.level;

	// Make weather parts
	makeTemperature.call(this, weather);
	makeWind.call(this, weather);
	makeTurbulence.call(this, weather);
	makeMist.call(this, weather);
	makeClouds.call(this, weather);
	makePrecipitation.call(this, weather);
	makeSea.call(this, weather);
	makePressure.call(this, weather);

	// Log mission weather info
	const logData = ["Weather:"];

	// Log weather state
	for (const state in weatherState) {

		if (weatherState[state] === this.weather.state) {

			logData.push(state.toLowerCase());
			break;
		}
	}

	// Log precipitation type (if any)
	if (this.weather.precipitation.type === precipitation.RAIN) {
		logData.push("rain");
	}
	else if (this.weather.precipitation.type === precipitation.SNOW) {
		logData.push("snow");
	}
	
	// Log mist state
	if (this.weather.mist) {
		logData.push("mist");
	}

	// Log other weather info
	logData.push({
		temp: this.weather.temperature.level + "°C",
		wind: Math.round(this.weather.wind[0].speed) + "m/s",
		turb: this.weather.turbulence,
		clouds: Math.round(this.weather.clouds.cover) + "%"
	});

	log.I.apply(log, logData);
};

// Make mission mist state
function makeMist() {
	
	const rand = this.rand;
	const time = this.time;
	const weather = this.weather;
	
	// TODO: Improve mist algorithm!
	
	// Don't use mist weather effect with strong winds
	if (weather.wind[0].speed > MIST_MAX_WIND_SPEED) {
		weather.mist = false;
	}
	// Use mist weather effect based on time
	else if (time.dusk || time.night || time.dawn || time.sunrise) {
		weather.mist = rand.bool(0.75); // 75%
	}
}

// Make mission clouds
function makeClouds() {

	const rand = this.rand;
	const options = this.items.Options;
	const points = this.weather.points.clouds;
	const maxCover = weatherLimits[this.weather.state].clouds;
	const requiredCover = maxCover * (points / weatherPoints.CLOUDS);
	const clouds = Object.keys(data.clouds);
	const hasMist = this.weather.mist;
	
	// Sort cloud configs based on cover
	rand.shuffle(clouds).sort((a, b) => {
		return data.clouds[b].cover - data.clouds[a].cover;
	});

	let config;

	// Use first config matching (closest to) required cloud cover (and mist state)
	for (config of clouds) {
		
		const cloudConfig = data.clouds[config];

		if (cloudConfig.cover <= requiredCover &&
			(hasMist === undefined || cloudConfig.mist === hasMist)) {
			
			break;
		}
	}

	const cloudsData = data.clouds[config];
	const altitude = cloudsData.altitude;
	const thickness = cloudsData.thickness;
	const cover = cloudsData.cover;

	// Register clouds data in mission Options block
	options.CloudConfig = this.map.clouds + "\\" + config;
	options.CloudLevel = altitude;
	options.CloudHeight = thickness;

	// Save generated mission clouds data
	this.weather.clouds = {
		altitude: altitude,
		thickness: thickness,
		cover: cover
	};
}

// Make mission precipitation
function makePrecipitation() {

	const rand = this.rand;
	const options = this.items.Options;

	const precData = {
		type: precipitation.NONE,
		level: 0
	};

	// Add precipitation only for overcast weather condition
	if (this.weather.clouds.cover >= 100) {

		// 80% chance for precipitation when overcast
		// TODO: Make the logic a bit more interesting
		const hasPrecipitation = rand.bool(0.8);

		if (hasPrecipitation) {

			// Use snow only in the winter season
			if (this.season === season.WINTER) {
				precData.type = precipitation.SNOW;
			}
			// Use rain for other seasons
			else {
				precData.type = precipitation.RAIN;
			}

			// TODO: Currently PrecLevel seems to be ignored and not supported at all
			precData.level = rand.integer(0, 100);
		}
	}

	// Register precipitation data in mission Options block
	options.PrecType = precData.type;
	options.PrecLevel = precData.level;

	// Save generated mission precipitation data
	this.weather.precipitation = precData;
}

// Make mission sea state
function makeSea() {

	// TODO: Not supported/implemented yet
	this.items.Options.SeaState = 0;
	this.weather.sea = 0;
}

// Make mission temperature
function makeTemperature(weather) {

	const rand = this.rand;
	const options = this.items.Options;
	const date = this.date;
	const sunrise = this.sunrise;
	const noon = this.noon;
	const temperature = this.weather.temperature = {};

	// NOTE: This algorithm was initially presented by De Wit et al. (1978)
	// and was obtained from the subroutine WAVE in ROOTSIMU V4.0 by Hoogenboom
	// and Huck (1986). It was slightly modified to support per minute precision
	// and TMAX temperature is set not for 14:00, but for solar noon + 1 hour.

	let tMin = weather[0];
	let tMax = weather[1];

	// Slightly shift original TMIN and TMAX temperatures with a random factor
	const tMaxShift = (tMax - tMin) * 0.15; // Max +-15% of temperature delta

	// NOTE: 66.6% for at least +-1 variation and 33.3% for no change at all
	tMin += rand.pick([-1, 0, 1]) * Math.max(rand.real(0, tMaxShift), 1);
	tMax += rand.pick([-1, 0, 1]) * Math.max(rand.real(0, tMaxShift), 1);

	// TODO: Cloudness will minimize diurnal daily TMIN/TMAX variations and will
	// cause lower temperatures during the day and higher during the night.

	const tDelta = temperature.variation = tMax - tMin;
	const tAvg = (tMin + tMax) / 2;
	const tAmp = tDelta / 2;
	const timeNow = (date.hour() * 60 + date.minute()) / 60;
	const timeTempMin = (sunrise.hour() * 60 + sunrise.minute()) / 60;
	const timeTempMax = (noon.hour() * 60 + noon.minute()) / 60 + 1; // 1 hour after solar noon
	const timeMid = 24 - timeTempMax; // Time left from TMAX to midnight (00:00)

	// Get temperature at a given point in time (minutes from midnight)
	function getTemp(time) {

		if (time < timeTempMin || time > timeTempMax) {

			let timeAmp;

			if (time < timeTempMin) {
				timeAmp = time + timeMid;
			}
			else {
				timeAmp = time - timeTempMax;
			}

			return tAvg + tAmp * Math.cos(Math.PI * timeAmp / (timeMid + timeTempMin));
		}
		else {
			return tAvg - tAmp * Math.cos(Math.PI * (time - timeTempMin) / (timeTempMax - timeTempMin));
		}
	}

	// Get current temperature
	const tempNow = getTemp(timeNow);

	// Peek at a temperature 15 minutes from now
	const tempSoon = getTemp((timeNow + 0.25) % 24);

	// Current temperature change state (for the next +15 minutes)
	temperature.state = (tempSoon - tempNow) / tDelta * 100;

	// Register temperature data in mission Options block
	// NOTE: Real mission temperature is set +15 minutes from now to adjust for
	// the fact temperatures will not change while the mission is running.
	temperature.level = Math.round(tempNow);
	options.Temperature = Math.round(tempSoon);
}

// Make mission atmospheric pressure
function makePressure() {

	const rand = this.rand;
	const cloudCover = this.weather.clouds.cover;
	const windSpeed = this.weather.wind[0].speed;
	const tempVariation = this.weather.temperature.variation;

	// Standard atmospheric pressure
	const pressureStandard = 760;

	// Modify pressure based on map average level/height
	// NOTE: At low altitudes above the sea level - the pressure decreases by
	// about 9 mmHg for every 100 meters.
	const pressureBase = pressureStandard - (this.map.level / 100 * 9);
	const pressureMin = pressureBase - MAX_PRESSURE_CHANGE;
	const pressureMax = pressureBase + MAX_PRESSURE_CHANGE;
	const pressureDelta = pressureMax - pressureMin;

	// Impact on pressure level (as a percent of total pressure delta variation)
	const PRESSURE_CLOUDS = 50;
	const PRESSURE_WIND = 25;
	const PRESSURE_TEMPERATURE = 25;

	// Low pressure - clouds, precipitation, minimal TMIN/TMAX changes, stronger winds.
	// High pressure - dry, mostly clear skies, larger TMIN/TMAX changes, lighter winds.

	let pressure = pressureMax;

	// Apply pressure change from cloud cover
	pressure -= pressureDelta * (PRESSURE_CLOUDS / 100) * (cloudCover / 100);

	// Apply pressure change from wind speed
	pressure -= pressureDelta * (PRESSURE_WIND / 100) * (windSpeed / MAX_WIND_SPEED);

	// Apply pressure change from diurnal temperature variations
	const tempVariationMax = 15; // Max variation in degrees Celsius
	const tempVariationFactor = 1 - Math.min(tempVariation / tempVariationMax, 1);

	pressure -= pressureDelta * (PRESSURE_TEMPERATURE / 100) * tempVariationFactor;

	// Apply small random pressure change factor (+-10% of delta)
	pressure += pressureDelta * rand.real(-0.1, 0.1, true);

	// Force min/max pressure levels
	pressure = Math.max(pressure, pressureMin);
	pressure = Math.min(pressure, pressureMax);
	pressure = Math.round(pressure);

	// Set pressure data
	this.items.Options.Pressure = pressure;
	this.weather.pressure = pressure;
}

// Make mission turbulence level
function makeTurbulence() {

	const rand = this.rand;
	const options = this.items.Options;
	const windSpeed = this.weather.wind[0].speed; // At ground level

	// FIXME: Turbulence is not linear - find a better way to compute this

	// NOTE: The last turbulence level point will only come from randomness
	let turbulence = (MAX_TURBULENCE - 1) * (windSpeed / MAX_WIND_SPEED);

	// Add some randomness (to make turbulence level non linear)
	turbulence += rand.real(-1, 1, true);

	// Force min/max turbulence levels
	turbulence = Math.max(turbulence, 0);
	turbulence = Math.min(turbulence, MAX_TURBULENCE);

	this.weather.turbulence = Math.round(turbulence);

	// Register turbulence level in mission Options block
	options.Turbulence = this.weather.turbulence;
}

// Make mission wind layers
function makeWind() {

	const rand = this.rand;
	const options = this.items.Options;
	const points = this.weather.points.winds;
	const wind = this.weather.wind = [];
	let groundSpeed = MAX_WIND_SPEED * (points / weatherPoints.WINDS);

	// Force minimum wind speed value
	if (groundSpeed < MIN_WIND_SPEED) {
		groundSpeed += MIN_WIND_SPEED;
	}

	options.WindLayers = [];

	let direction;
	let speed;

	// Make wind for each altitude layer
	for (const altitude of [0, 500, 1000, 2000, 5000]) {

		// Use a random initial wind direction at ground level
		if (direction === undefined) {
			direction = rand.real(0, 360);
		}
		// Slightly vary direction with each higher level
		else {
			direction = (direction + rand.real(-MAX_WIND_CHANGE, MAX_WIND_CHANGE) + 360) % 360;
		}

		// Initial generated wind speed at ground level
		if (speed === undefined) {
			speed = groundSpeed;
		}
		// Apply wind profile power law for higher levels
		else {
			speed = groundSpeed * Math.pow(altitude / this.map.level, rand.real(0.10, 0.15));
		}

		// TODO: Increase vertical wind shear at night

		// Use two decimal points for direction and speed precision
		direction = Number(direction.toFixed(2));
		speed = Number(speed.toFixed(2));

		// Save wind layer data
		wind.push({
			altitude: altitude,
			direction: direction,
			speed: speed
		});

		// Register wind layer in mission Options block
		options.WindLayers.push([altitude, direction, speed]);
	}
}