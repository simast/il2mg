/** @copyright Simas Toleikis, 2014 */
"use strict";

// Load required data
var DATA = {
	clouds: require("../data/clouds")
};

// Make mission clouds
function makeClouds(mission) {

	var options = mission.blocks.Options;

	var cloudTypes = Object.keys(DATA.clouds);
	var cloudType = cloudTypes[Math.floor(Math.random() * cloudTypes.length)];

	cloudType = "00_Clear_00\\sky.ini";

	var clouds = DATA.clouds[cloudType];
	var cloudLevel = Math.round(clouds.level[0] + Math.random() * (clouds.level[1] - clouds.level[0]));
	var cloudHeight = Math.round(clouds.height[0] + Math.random() * (clouds.height[1] - clouds.height[0]));

	// TODO: Weather
	options.set("CloudConfig", cloudType);
	options.set("CloudLevel", cloudLevel);
	options.set("CloudHeight", cloudHeight);
}

// Make mission precipitation
function makePrecipitation(mission) {

	var options = mission.blocks.Options;

	options.set("PrecLevel", 100);
	options.set("PrecType", 2);
}

// Generate mission weather and atmospheric conditions
module.exports = function(mission) {

	var options = mission.blocks.Options;

	makeClouds(mission);
	makePrecipitation(mission);

	options.set("SeaState", 0);
	options.set("Turbulence", 0);
	options.set("TempPressLevel", 0);
	options.set("Temperature", -15);
	options.set("Pressure", 760);
	options.set("WindLayers", [
		"0:126:3",
		"500:120.147:7.27",
		"1000:116.507:11.04",
		"2000:105.961:13.66",
		"5000:92.6825:15.41"
	]);
};