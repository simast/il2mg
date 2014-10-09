/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../mission").DATA;

// Make mission clouds
function makeClouds(mission) {

	var options = mission.blocks.Options;
	var weather = mission.battle.weather[mission.date.format("YYYY-MM-DD")];

	options.CloudConfig = "00_Clear_04\\sky.ini";
	options.CloudLevel = 400;
	options.CloudHeight = 100;

	// TODO
}

// Make mission precipitation
function makePrecipitation(mission) {

	var options = mission.blocks.Options;

	options.PrecLevel = 10;
	options.PrecType = 2;
}

// Generate mission weather and atmospheric conditions
module.exports = function(mission) {

	var options = mission.blocks.Options;

	makeClouds(mission);
	makePrecipitation(mission);

	options.SeaState = 0;
	options.Turbulence = 0;
	options.TempPressLevel = 0;
	options.Temperature = -15;
	options.Pressure = 760;
	options.WindLayers = [
		"0:126:3",
		"500:120.147:7.27",
		"1000:116.507:11.04",
		"2000:105.961:13.66",
		"5000:92.6825:15.41"
	];
};