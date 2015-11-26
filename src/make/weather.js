/** @copyright Simas Toleikis, 2015 */
"use strict";

var weatherState = DATA.weatherState;

// Generate mission weather and atmospheric conditions
module.exports = function makeWeather() {

	var rand = this.rand;
	var options = this.items.Options;
	var weather = this.battle.weather[this.date.format("YYYY-MM-DD")];
	var state = weather[2];
	
	// TODO: Use a logarithmic curve for picking weather state from interval?
	if (Array.isArray(state)) {
		state = rand.integer(state[0], state[1]);
	}
	
	// TODO: Adjust weather state based on player plane size
	
	this.weather = {
		state: state
	};
	
	// TODO: Level in meters at what point temperature and pressure is measured?
	options.TempPressLevel = 0;

	// Make weather parts
	makeClouds.call(this, weather);
	makePrecipitation.call(this, weather);
	makeSea.call(this, weather);
	makeTemperature.call(this, weather);
	makePressure.call(this, weather);
	makeWind.call(this, weather);
	makeTurbulence.call(this, weather);
};

// Make mission clouds
function makeClouds(weather) {

	var options = this.items.Options;
	var rand = this.rand;

	var cloudsType = [0, 4]; // TODO
	if (Array.isArray(cloudsType)) {
		cloudsType = rand.integer(cloudsType[0], cloudsType[1]);
	}

	var cloudsData = rand.pick(DATA.clouds[cloudsType]);

	var altitude = cloudsData.altitude;
	if (Array.isArray(altitude)) {
		altitude = rand.integer(altitude[0], altitude[1]);
	}

	var thickness = cloudsData.thickness;
	if (Array.isArray(thickness)) {
		thickness = rand.integer(thickness[0], thickness[1]);
	}

	// Set clouds data for Options item
	options.CloudConfig = this.map.season + "\\" + cloudsData.config;
	options.CloudLevel = altitude;
	options.CloudHeight = thickness;

	// Save generated mission clouds data
	this.weather.clouds = {
		type: cloudsType,
		altitude: altitude,
		thickness: thickness
	};
}

// Make mission precipitation
function makePrecipitation(weather) {

	var options = this.items.Options;
	var rand = this.rand;

	var precipitation = {
		type: 0, // None
		level: 0
	};

	// Add precipitation only for overcast weather condition
	if (this.weather.clouds.type == 4) {

		// 80% chance for precipitation when overcast
		// TODO: Make the logic a bit more interesting
		var hasPrecipitation = rand.bool(0.8);

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

	var options = this.items.Options;
	var rand = this.rand;
	var date = this.date;
	var sunrise = this.sunrise;
	var noon = this.noon;
	
	// NOTE: This algorithm was initially presented by De Wit et al. (1978)
	// and was obtained from the subroutine WAVE in ROOTSIMU V4.0 by Hoogenboom
	// and Huck (1986). It was slightly modified to support per minute precision
	// and TMAX temperature is set not for 14:00, but for solar noon + 1 hour.
	
	var tMin = weather[0];
	var tMax = weather[1];
	
	// Slightly shift original TMIN and TMAX temperatures with a random factor
	var tMaxShift = (tMax - tMin) * 0.15; // Max +-15% of temperature delta
	
	// NOTE: 66.6% for at least +-1 variation and 33.3% for no change at all
	tMin += rand.pick([-1, 0, 1]) * Math.max(rand.real(0, tMaxShift), 1);
	tMax += rand.pick([-1, 0, 1]) * Math.max(rand.real(0, tMaxShift), 1);
	
	// TODO: Cloudness should affect TMIN and TMAX temperatures?
	
	var tDelta = tMax - tMin;
	var tAvg = (tMin + tMax) / 2;
	var tAmp = tDelta / 2;
	var timeNow = (date.hour() * 60 + date.minute()) / 60;
	var timeTempMin = (sunrise.hour() * 60 + sunrise.minute()) / 60;
	var timeTempMax = (noon.hour() * 60 + noon.minute()) / 60 + 1; // 1 hour after solar noon
	var timeMid = 24 - timeTempMax; // Time left from TMAX to midnight (00:00)
	
	// Get temperature at a given point in time (minutes from midnight)
	function getTemp(time) {
		
		if (time < timeTempMin || time > timeTempMax) {
			
			var timeAmp;
			
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
	var tempNow = getTemp(timeNow);
	
	// Peek at a temperature 15 minutes from now
	var tempSoon = getTemp((timeNow + 0.25) % 24);
	
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
	var pressure = this.rand.integer(750, 770); // Millimetres of mercury (mmHg)

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

	// TODO: Not supported/implemented yet
	this.items.Options.WindLayers = [
		[0, 126, 3],
		[500, 120.147, 7.27],
		[1000, 116.507, 11.04],
		[2000, 105.961, 13.66],
		[5000, 92.6825, 15.41]
	];
}