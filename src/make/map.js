/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission map data
module.exports = function makeMap() {

	const options = this.items.Options;
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

// Utility function used to check if a given position is an offmap point
function isOffmapPoint(posX, posZ, mapWidth, mapHeight) {
	return (posX < 0 || posZ < 0 || posX > mapHeight || posZ > mapWidth);
}

module.exports.isOffmapPoint = isOffmapPoint;