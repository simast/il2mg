/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make a windsock airfield item
module.exports = function(mission, item) {

	if (!this.country) {
		return;
	}

	var itemType = mission.data.getItemType(item[4]);
	var itemObject = mission.createItem(itemType.type, false);

	itemObject.Model = itemType.model;
	itemObject.Script = itemType.script;
	itemObject.setPosition(item[1], item[2]);
	itemObject.setOrientation(item[3]);

	itemObject.createEntity();

	// TODO: Attach windsock to airfield bubble

	return [itemObject];
};