/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make airfield beacon item
module.exports = function makeAirfieldBeacon(airfield, item) {

	if (!airfield.country) {
		return;
	}

	// Initialize beacons index table
	if (!this.beaconsByAirfield) {
		this.beaconsByAirfield = Object.create(null);
	}

	var itemType = DATA.getItemType(item[5]);
	var beaconItem = this.createItem(itemType.type, false);

	beaconItem.Model = itemType.model;
	beaconItem.Script = itemType.script;
	beaconItem.setPosition(item[1], item[2], item[3]);
	beaconItem.setOrientation(item[4]);
	beaconItem.Country = airfield.country;
	beaconItem.Engageable = 0;
	beaconItem.BeaconChannel = 0;

	beaconItem.createEntity(true);

	// Attach beacon to airfield "bubble" zone
	airfield.zone.onActivate.addObject(beaconItem);
	airfield.zone.onDeactivate.addObject(beaconItem);

	// Save beacon item reference
	this.beaconsByAirfield[airfield.id] = beaconItem;

	return [beaconItem];
};