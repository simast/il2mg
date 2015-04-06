/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make mission clouds
function makeClouds(weather) {

	var options = this.items.Options;
	var rand = this.rand;

	var cloudsType = weather[1];
	if (Array.isArray(cloudsType)) {
		cloudsType = rand.integer(cloudsType[0], cloudsType[1]);
	}

	var cloudsData = rand.pick(this.data.clouds[cloudsType]);

	var altitude = cloudsData.altitude;
	if (Array.isArray(altitude)) {
		altitude = rand.integer(altitude[0], altitude[1]);
	}

	var thickness = cloudsData.thickness;
	if (Array.isArray(thickness)) {
		thickness = rand.integer(thickness[0], thickness[1]);
	}

	// Set clouds data for Options item
	options.CloudConfig = cloudsData.config;
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

	var temperature = weather[0];
	if (Array.isArray(temperature)) {
		temperature = rand.integer(temperature[0], temperature[1]);
	}

	// Set temperature data for Options item
	options.Temperature = temperature;
	options.TempPressLevel = 0;
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

// Generate mission weather and atmospheric conditions
module.exports = function() {

	var options = this.items.Options;
	var weather = this.battle.weather[this.date.format("YYYY-MM-DD")];

	this.weather = {};

	makeClouds.call(this, weather);
	makePrecipitation.call(this, weather);
	makeSea.call(this, weather);
	makeTemperature.call(this, weather);
	makePressure.call(this, weather);

	options.Turbulence = 1;
	options.WindLayers = [
		[0, 126, 3],
		[500, 120.147, 7.27],
		[1000, 116.507, 11.04],
		[2000, 105.961, 13.66],
		[5000, 92.6825, 15.41]
	];
};