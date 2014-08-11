/** @copyright Simas Toleikis, 2014 */
"use strict";

var Icon = require("../block/icon");
var Camera = require("../block/camera");

// Load required data
var DATA = {
	countries: require("../data/countries"),
};

// Generate mission map
module.exports = function(mission) {

	var params = mission.params;
	var battle = mission.battle;

	// Load battle data
	DATA.airfields = require("../data/" + mission.battleID + "/airfields");

	var activeCoalitions = [];

	// Make a list of active battle coalitions
	battle.countries.forEach(function(countryID) {
		activeCoalitions.push(DATA.countries[countryID].coalition);
	});

	var airfieldIcons = mission.blocks.airfieldIcons = [];

	// Generate all airfield names
	for (var airfieldID in DATA.airfields) {

		var airfield = DATA.airfields[airfieldID];

		var iconType = Icon.NONE;

		// Generate point icons for airfield names in debug mode
		if (params.debug) {
			iconType = Icon.POINT;
		}

		var airfieldIcon = new Icon(iconType);

		airfieldIcon.setPosition(airfield.x, 0, airfield.z);
		airfieldIcon.setCoalitions(activeCoalitions);
		airfieldIcon.setName(mission.lang(airfield.name));

		airfieldIcons.push(airfieldIcon);
	}

	// Create default camera
	var defaultCamera = mission.blocks.defaultCamera = new Camera();

	defaultCamera.setPosition(135785.82, 1000 + 141.9, 233943.35);
	defaultCamera.setOrientation(0, 0, -90);
	defaultCamera.set("Speed", 0);
	defaultCamera.set("FOV", 100);
	defaultCamera.set("FirstId", -1);
	defaultCamera.set("SecondId", -1);
	defaultCamera.set("LockView", 0);
	defaultCamera.set("CameraType", 0);
	defaultCamera.set("Config", "");
	defaultCamera.setCoalitions(activeCoalitions);

};