/** @copyright Simas Toleikis, 2014 */
"use strict";

var DATA = require("../mission").DATA;
var Icon = require("../entity/Icon");
var Camera = require("../entity/Camera");

// Generate mission places
module.exports = function(mission) {

	var params = mission.params;
	var battle = mission.battle;

	// Make a list of active battle coalitions
	var activeCoalitions = [];

	// Unknown coalition
	activeCoalitions.push(0);

	// Coalitions from active countries
	for (var countryID in battle.countries) {
		activeCoalitions.push(DATA.countries[countryID].coalition);
	}

	var placeIcons = mission.entities.placeIcons = [];

	// Generate place names on the map
	for (var placeID in battle.places) {

		var place = battle.places[placeID];
		var placeIcon = new Icon(Icon.NONE);

		placeIcon.setPosition(place.position);
		placeIcon.setCoalitions(activeCoalitions);
		placeIcon.setName(mission.lang(place.name));

		placeIcons.push(placeIcon);
	}

	// Generate all airfield icons and names in debug mode
	if (params.debug) {

		var airfieldIcons = mission.entities.airfieldIcons = [];

		for (var airfieldID in battle.airfields) {

			var airfield = battle.airfields[airfieldID];
			var airfieldIcon = new Icon(Icon.POINT);

			airfieldIcon.setPosition(airfield.position);
			airfieldIcon.setCoalitions(activeCoalitions);
			airfieldIcon.setName(mission.lang(airfield.name));

			airfieldIcons.push(airfieldIcon);
		}
	}

	/*
	// Create default camera
	var defaultCamera = mission.entities.defaultCamera = new Camera();

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
	*/

};