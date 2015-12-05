/** @copyright Simas Toleikis, 2015 */
"use strict";

const MAX_WIND_SPEED = 12; // Maximum wind speed (m/s)
const MIN_WIND_SPEED = 0.25; // Minimum wind speed (m/s)
const MAX_CLOUD_COVER = 100; // Maximum cloud cover (%)

// Weather state types
const weatherState = DATA.weatherState;

// Maximum weather state points distribution (%)
const weatherPoints = {
	CLOUDS: 40,
	WINDS: 60
};

// Weather state limits
const weatherLimits = {
	[weatherState.PERFECT]: {
		clouds: 10, // Maximum cloud cover (%)
		winds: 3 // Maximum wind speed (m/s)
	},
	[weatherState.GOOD]: {
		clouds: 40,
		winds: 5
	},
	[weatherState.BAD]: {
		clouds: 99,
		winds: 7
	},
	[weatherState.EXTREME]: {
		clouds: MAX_CLOUD_COVER,
		winds: MAX_WIND_SPEED
	}
};

// Compute maximum points for weather state limits
for (let state in weatherLimits) {
	
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
	}
	
	// Get current state minimum and maximum weather points interval
	const limits = weatherLimits[state];
	const prevLimits = weatherLimits[state - 1];
	const minPoints = prevLimits ? Math.max(prevLimits.points.total, 0) : 0;
	const maxPoints = Math.min(limits.points.total, 100);
	
	// Pick random weather points number
	const points = rand.real(minPoints, maxPoints, true);
	
	// Set points for clouds and winds by using a shifted interval method
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
	makeClouds.call(this, weather);
	makePrecipitation.call(this, weather);
	makeWind.call(this, weather);
	makeTurbulence.call(this, weather);
	makeSea.call(this, weather);
	makePressure.call(this, weather);
};

// Make mission clouds
function makeClouds(weather) {
	
	const rand = this.rand;
	const options = this.items.Options;
	const points = this.weather.points.clouds;
	const maxCover = weatherLimits[this.weather.state].clouds;
	const requiredCover = maxCover * (points / weatherPoints.CLOUDS);
	const clouds = Object.keys(DATA.clouds);
	
	// Sort cloud configs based on cover
	rand.shuffle(clouds).sort(function(a, b) {
		return DATA.clouds[b].cover - DATA.clouds[a].cover;
	});
	
	let config;
	
	// Use first config matching (closest to) required cloud cover
	for (config of clouds) {
		
		if (DATA.clouds[config].cover <= requiredCover) {
			break;
		}
	}
	
	const cloudsData = DATA.clouds[config];
	const altitude = cloudsData.altitude;
	const thickness = cloudsData.thickness;
	const cover = cloudsData.cover;
	
	// Set clouds data for Options item
	options.CloudConfig = this.map.season + "\\" + config;
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
function makePrecipitation(weather) {

	const rand = this.rand;
	const options = this.items.Options;

	const precipitation = {
		type: 0, // None
		level: 0
	};

	// Add precipitation only for overcast weather condition
	if (this.weather.clouds.cover >= 100) {

		// 80% chance for precipitation when overcast
		// TODO: Make the logic a bit more interesting
		const hasPrecipitation = rand.bool(0.8);

		if (hasPrecipitation) {

			if (this.map.season === "winter") {
				precipitation.type = 2; // Snow
			}
			else {
				precipitation.type = 1; // Rain
			}

			// TODO: Currently PrecLevel seems to be ignored and not supported at all
			precipitation.level = rand.integer(0, 100);
		}
	}

	// Set precipitation data for Options item
	options.PrecType = precipitation.type;
	options.PrecLevel = precipitation.level;

	// Save generated mission precipitation data
	this.weather.precipitation = precipitation;
}

// Make mission sea state
function makeSea(weather) {

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
	
	// TODO: Cloudness should affect TMIN and TMAX temperatures?
	
	const tDelta = tMax - tMin;
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
	this.weather.temperatureState = (tempSoon - tempNow) / tDelta * 100;
	
	// Set temperature data for Options item
	// NOTE: Real mission temperature is set +15 minutes from now to adjust for
	// the fact temperatures will not change while the mission is running.
	this.weather.temperature = Math.round(tempNow);
	options.Temperature = Math.round(tempSoon);
}

// Make mission atmospheric pressure
function makePressure(weather) {

	// TODO: Improve atmospheric pressure selection logic (temperature and humidity
	// affect the atmospheric pressure).
	const pressure = this.rand.integer(750, 770); // Millimetres of mercury (mmHg)

	// Set pressure data
	this.items.Options.Pressure = pressure;
	this.weather.pressure = pressure;
}

// Make mission turbulence level
function makeTurbulence(weather) {

	// TODO: Not supported/implemented yet
	this.items.Options.Turbulence = 1;
}

// Make mission wind layers
function makeWind(weather) {
	
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
	for (let altitude of [0, 500, 1000, 2000, 5000]) {
		
		// Use a random initial wind direction at ground level
		if (direction === undefined) {
			direction = rand.real(0, 360);
		}
		// Slightly vary direction with each higher level
		else {
			direction = (direction + rand.real(-30, 30) + 360) % 360;
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