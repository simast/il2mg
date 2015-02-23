/** @copyright Simas Toleikis, 2015 */
"use strict";

var util = require("util");
var moment = require("moment");

// Generate mission map data
module.exports = function(mission, data) {

	var options = mission.items.Options;
	var map = mission.battle.map;

	// Find matching battle map based on mission date
	if (Array.isArray(map)) {

		var date = mission.date;

		var foundMaps = map.filter(function(map) {

			var mapFrom = moment(map.from);
			var mapTo = moment(map.to);

			if (date.isSame(mapFrom, "day") || date.isSame(mapTo, "day")) {
				return true;
			}

			return date.isBetween(mapFrom, mapTo);
		});

		if (foundMaps.length) {
			map = foundMaps[0];
		}
		else {

			var dateStr = date.format("YYYY-MM-DD");

			throw util.format('Could not find a map for "%s" mission date.', dateStr);
		}
	}

	// Set map data
	options.HMap = map.heightmap;
	options.Textures = map.textures;
	options.Forests = map.forests;
	options.Layers = ""; // TODO: ?
	options.GuiMap = map.gui;
	options.SeasonPrefix = ""; // TODO: Required?

	// Set active mission map
	mission.map = map;
};