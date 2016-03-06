/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Generate mission map data
module.exports = function makeMap() {

	const options = this.items.Options;
	const date = this.date;
	const map = {};

	Object.assign(map, this.battle.map);
	
	const seasonData = map.season[this.season];

	if (!seasonData) {
		throw new Error("Could not find a valid battle map!");
	}
	
	delete map.season;
	Object.assign(map, seasonData);

	// Set map data
	options.HMap = map.heightmap;
	options.Textures = map.textures;
	options.Forests = map.forests;
	options.Layers = ""; // TODO: ?
	options.GuiMap = map.gui;
	options.SeasonPrefix = map.prefix;
	
	// Set active mission map data
	this.map = map;
};