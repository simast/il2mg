/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make airfield beacon item
module.exports = function makeAirfieldBeacon(airfield, item) {

	if (!airfield.country) {
		return;
	}

	var itemType = this.data.getItemType(item[5]);
	var beaconItem = this.createItem(itemType.type, false);

	beaconItem.Model = itemType.model;
	beaconItem.Script = itemType.script;
	beaconItem.setPosition(item[1], item[2], item[3]);
	beaconItem.setOrientation(item[4]);

	// TODO: Make beacons only for player related airfields
	// TODO: Set different beacon channels

	beaconItem.Country = airfield.country;
	beaconItem.Engageable = 0;
	beaconItem.BeaconChannel = 1;

	beaconItem.createEntity();

	return [beaconItem];
};