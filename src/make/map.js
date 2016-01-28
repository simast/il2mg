/** @copyright Simas Toleikis, 2015 */
"use strict";

const moment = require("moment");
const data = require("../data");

// Generate mission map data
module.exports = function makeMap() {

	const options = this.items.Options;
	const date = this.date;
	const map = {};

	Object.assign(map, this.battle.map);

	// Find matching map season based on mission date
	for (const season in map.season) {

		const mapData = map.season[season];
		const mapFrom = moment(mapData.from);
		const mapTo = moment(mapData.to);

		// Found matching season map
		if (date.isSameOrAfter(mapFrom, "day") && date.isSameOrBefore(mapTo, "day")) {

			map.season = season;
			map.data = mapData;

			break;
		}
	}

	if (!map.data) {
		throw new Error("Could not find a valid battle map!");
	}

	// Set map data
	options.HMap = map.data.heightmap;
	options.Textures = map.data.textures;
	options.Forests = map.data.forests;
	options.Layers = ""; // TODO: ?
	options.GuiMap = map.data.gui;
	options.SeasonPrefix = map.data.prefix;

	// Set active mission map data
	this.map = map;
};