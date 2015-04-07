/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make airfield beacon item
module.exports = function makeAirfieldBeacon(airfield, item) {

	if (!airfield.country) {
		return;
	}

	var itemType = this.data.getItemType(item[4]);
	var itemObject = this.createItem(itemType.type, false);

	itemObject.Model = itemType.model;
	itemObject.Script = itemType.script;
	itemObject.setPosition(item[1], item[2]);
	itemObject.setOrientation(item[3]);

	// TODO: Make beacons only for player related airfields
	// TODO: Set different beacon channels

	itemObject.Country = airfield.country;
	itemObject.BeaconChannel = 1;

	itemObject.createEntity();

	return [itemObject];
};