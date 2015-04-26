/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make airfield windsock item
module.exports = function makeAirfieldWindsock(airfield, item) {

	if (!airfield.country) {
		return;
	}

	var itemType = this.data.getItemType(item[5]);
	var itemObject = this.createItem(itemType.type, false);

	itemObject.Model = itemType.model;
	itemObject.Script = itemType.script;
	itemObject.setPosition(item[1], item[2], item[3]);
	itemObject.setOrientation(item[4]);

	itemObject.createEntity();

	// TODO: Attach windsock to airfield bubble

	return [itemObject];
};