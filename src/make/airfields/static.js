/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemFlags = require("./").itemFlags;

// Make a normal static airfield item
module.exports = function(mission, item) {

	var itemType = mission.data.getItemType(item[0]);
	var itemObject = mission.createItem(itemType.type, false);

	itemObject.Model = itemType.model;
	itemObject.Script = itemType.script;
	itemObject.setPosition(item[1], item[2]);
	itemObject.setOrientation(item[3]);

	// Decoration item
	if (item[4] === itemFlags.BLOCK_DECO) {
		itemObject.Durability = 500;
	}

	return [itemObject];
};