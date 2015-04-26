/** @copyright Simas Toleikis, 2015 */
"use strict";

var itemFlags = require("./").itemFlags;

// Make airfield static item
module.exports = function makeAirfieldStatic(airfield, item) {

	var itemType = this.data.getItemType(item[0]);
	var itemObject = this.createItem(itemType.type, false);

	itemObject.Model = itemType.model;
	itemObject.Script = itemType.script;
	itemObject.setPosition(item[1], item[2], item[3]);
	itemObject.setOrientation(item[4]);

	// Decoration item
	if (item[5] === itemFlags.BLOCK_DECO) {
		itemObject.Durability = 500;
	}
	// Set static item country (required for spawning infantry)
	else if (airfield.country) {
		
		var time = this.time;
		var countryChance = 0.8; // 80%
		
		// Less infantry for dark time periods
		if (time.night) {
			countryChance = 0.25; // 25%
		}
		else if (time.sunset || time.dusk || time.dawn) {
			countryChance = 0.5; // 50%
		}
		
		if (this.rand.bool(countryChance)) {
			itemObject.Country = this.rand.pick(airfield.countriesWeighted);
		}
	}

	return [itemObject];
};