/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");

// Make airfield beacon item
module.exports = function makeAirfieldBeacon(airfield, item) {

	if (!airfield.country) {
		return;
	}
	
	const beaconItem = this.createItem(data.getItemType(item[5]), false);
	
	beaconItem.setName("NOICON");
	beaconItem.setPosition(item[1], item[2], item[3]);
	beaconItem.setOrientation(item[4]);
	beaconItem.setCountry(airfield.country);
	beaconItem.Engageable = 0;
	beaconItem.BeaconChannel = 0;
	
	// FIXME: Enabling spotter for beacon seems to cause issues with OnTookOff reports.
	// beaconItem.Spotter = 10 * 1000; // 10 Km radius

	beaconItem.createEntity(true);

	// Attach beacon to airfield "bubble" zone
	airfield.zone.onActivate.addObject(beaconItem);
	airfield.zone.onDeactivate.addObject(beaconItem);

	// Save beacon item reference
	airfield.beacon = beaconItem;

	return [beaconItem];
};