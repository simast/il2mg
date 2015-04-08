/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemFlags = require("./").itemFlags;

// Make airfield static item
module.exports = function makeAirfieldStatic(airfield, item) {

	var itemType = this.data.getItemType(item[0]);
	var itemObject = this.createItem(itemType.type, false);

	itemObject.Model = itemType.model;
	itemObject.Script = itemType.script;
	itemObject.setPosition(item[1], item[2]);
	itemObject.setOrientation(item[3]);

	// Decoration item
	if (item[4] === itemFlags.BLOCK_DECO) {
		itemObject.Durability = 500;
	}
	
	// Set static item country (required for spawning infantry)
	// TODO: Limit number of country blocks (less infantry during the night)
	if (airfield.country) {
		itemObject.Country = this.rand.pick(airfield.countriesWeighted);
	}

	return [itemObject];
};