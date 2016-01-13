/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make airfield windsock item
module.exports = function makeAirfieldWindsock(airfield, item) {

	if (!airfield.country) {
		return;
	}

	const itemType = DATA.getItemType(item[5]);
	const windsockItem = this.createItem(itemType.type, false);

	windsockItem.Model = itemType.model;
	windsockItem.Script = itemType.script;
	windsockItem.setPosition(item[1], item[2], item[3]);
	windsockItem.setOrientation(item[4]);
	windsockItem.StartHeight = 1;

	windsockItem.createEntity(true);

	// Attach windsock to airfield "bubble" zone
	airfield.zone.onActivate.addObject(windsockItem);
	airfield.zone.onDeactivate.addObject(windsockItem);

	return [windsockItem];
};