/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../mission").DATA;

// Make mission clouds
function makeClouds(mission, weather) {

	var options = mission.blocks.Options;
	var rand = mission.rand;

	var cloudsType = weather[1];
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

	// Set clouds data for Options block
	options.CloudConfig = cloudsData.config;
	options.CloudLevel = altitude;
	options.CloudHeight = thickness;

	// Save generated mission clouds data
	mission.weather.clouds = {
		type: cloudsType,
		altitude: altitude,
		thickness: thickness
	};
}

// Make mission precipitation
function makePrecipitation(mission, weather) {

	var options = mission.blocks.Options;
	var rand = mission.rand;

	var precipitation = {
		type: 0, // None
		level: 0
	};

	// Add precipitation only for overcast weather condition
	if (mission.weather.clouds.type == 4) {

		// 80% chance for precipitation when overcast
		// TODO: Make the logic a bit more interesting
		var hasPrecipitation = rand.bool(0.8);

		if (hasPrecipitation) {

			if (mission.battle.map.has.snow) {
				precipitation.type = 2; // Snow
			}
			else {
				precipitation.type = 1; // Rain
			}

			// TODO: Currently PrecLevel seems to be ignored and not supported at all
			precipitation.level = rand.integer(0, 100);
		}
	}

	// Set precipitation data for Options block
	options.PrecType = precipitation.type;
	options.PrecLevel = precipitation.level;

	// Save generated mission precipitation data
	mission.weather.precipitation = precipitation;
}

// Make mission sea state
function makeSea(mission, weather) {

	// TODO: Not supported/implemented yet
	mission.blocks.Options.SeaState = 0;
	mission.weather.sea = 0;
}

// Make mission temperature
function makeTemperature(mission, weather) {

	var options = mission.blocks.Options;
	var rand = mission.rand;

	var temperature = weather[0];
	if (Array.isArray(temperature)) {
		temperature = rand.integer(temperature[0], temperature[1]);
	}

	// Set temperature data for Options block
	options.Temperature = temperature;
	options.TempPressLevel = 0;
}

// Make mission atmospheric pressure
function makePressure(mission, weather) {

	// TODO: Improve atmospheric pressure selection logic (temperature and humidity
	// affect the atmospheric pressure).
	var pressure = mission.rand.integer(750, 770); // Millimetres of mercury (mmHg)

	// Set pressure data
	mission.blocks.Options.Pressure = pressure;
	mission.weather.pressure = pressure;
}

// Generate mission weather and atmospheric conditions
module.exports = function(mission) {

	var options = mission.blocks.Options;
	var weather = mission.battle.weather[mission.date.format("YYYY-MM-DD")];

	mission.weather = {};

	makeClouds(mission, weather);
	makePrecipitation(mission, weather);
	makeSea(mission, weather);
	makeTemperature(mission, weather);
	makePressure(mission, weather);

	options.Turbulence = 0;
	options.WindLayers = [
		"0:126:3",
		"500:120.147:7.27",
		"1000:116.507:11.04",
		"2000:105.961:13.66",
		"5000:92.6825:15.41"
	];
};