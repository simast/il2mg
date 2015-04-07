/** @copyright Simas Toleikis, 2015 */
"use strict";

var moment = require("moment");

// Generate mission map data
module.exports = function makeMap() {

	var options = this.items.Options;
	var map = this.battle.map;

	// Find matching battle map based on mission date
	if (Array.isArray(map)) {

		var date = this.date;

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
			throw new Error("Could not find a valid battle map!");
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
	this.map = map;
};