/** @copyright Simas Toleikis, 2015 */
"use strict";

const moment = require("moment");

// Generate mission map data
module.exports = function makeMap() {
	
	const options = this.items.Options;
	const date = this.date;
	const map = {};
	let seasonMap;
	
	Object.assign(map, this.battle.map);

	// Find matching map season based on mission date
	for (let season in map.season) {
		
		const mapData = map.season[season];
		const mapFrom = moment(mapData.from);
		const mapTo = moment(mapData.to);
		
		// Found matching season map
		if (date.isSame(mapFrom, "day") || date.isSame(mapTo, "day") ||
				date.isBetween(mapFrom, mapTo)) {
			
			seasonMap = mapData;
			map.season = season;
			
			break;
		}
	}

	if (!seasonMap) {
		throw new Error("Could not find a valid battle map!");
	}

	// Set map data
	options.HMap = seasonMap.heightmap;
	options.Textures = seasonMap.textures;
	options.Forests = seasonMap.forests;
	options.Layers = ""; // TODO: ?
	options.GuiMap = seasonMap.gui;
	options.SeasonPrefix = seasonMap.prefix;
	
	// Set active mission map data
	this.map = map;
};