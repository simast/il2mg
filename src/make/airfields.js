/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Data tags for airfield items
var itemTags = {
	AA_FLAK: -6, // Anti-aircraft (Flak)
	AA_MG: -5, // Anti-aircraft (MG)
	CAR: -4, // Car vehicle
	TRUCK_FUEL: -3, // Fuel truck
	TRUCK_CARGO: -2, // Cargo truck
	PLANE: -1, // Plane spot
	DECO: 1, // Decoration
	FUEL: 2, // Fuel item
	WINDSOCK: 3, // Windsock
	BEACON: 4 // Beacon
};

// Generate mission airfields
module.exports = function(mission, data) {

	var params = mission.params;
	var battle = mission.battle;
	var airfields = battle.airfields;

	for (var airfieldID in airfields) {

		var airfield = airfields[airfieldID];

		if (!airfield.items || !airfield.items.length) {
			continue;
		}

		var itemsGroup = new Item.Group();

		itemsGroup.setName(airfield.name);

		// Walk/process each airfield item
		(function walkItems(items, isGroup) {

			// Used to delay normal item insertion until any of the special items
			// were included in a group. If no special items are used - all normal
			// items in a group are also not included. This allows to group, for
			// example, an anti-aircraft special item together with a normal decoration
			// item, but if the AA special item is not used - the AA decoration item
			// is also not included.
			var extraItems = [];
			var useExtraItems = false;

			items.forEach(function(item) {

				var itemTypeID = item[0];

				// Process item group
				if (Array.isArray(itemTypeID)) {
					walkItems(item, true);
				}

				var itemObjects = [];

				// Normal static item
				if (itemTypeID >= 0) {

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						itemObjects = makeStaticItem(item);
					}
				}
				// Special item
				else {

					switch (itemTypeID) {

						// Stationary/static vehicle item
						case itemTags.TRUCK_CARGO:
						case itemTags.TRUCK_FUEL:
						case itemTags.CAR: {

							itemObjects = makeStaticVehicle(item);
							break;
						}

						// Anti-aircraft vehicle item
						case itemTags.AA_FLAK:
						case itemTags.AA_MG: {

							itemObjects = makeAAVehicle(item);
							break;
						}
					}

					// Use all extra normal items in a group if special item is used
					if (itemObjects.length) {
						useExtraItems = true;
					}
				}

				// Add generated item objects to airfield group
				if (Array.isArray(itemObjects) && itemObjects.length) {

					itemObjects.forEach(function(itemObject) {

						// TODO: Build a items index (to quickly lookup items based on position)
						itemsGroup.addItem(itemObject);
					});
				}
			});

			// Include extra items
			if (useExtraItems && extraItems.length) {
				walkItems(extraItems, false);
			}

		})(mission.rand.shuffle(airfield.items), false);

		// Add all items as a single airfield group in a mission file
		mission.addItem(itemsGroup);
	}

	// Make a normal static item
	function makeStaticItem(item) {

		var itemType = data.getItemType(item[0]);
		var itemData = item[4];

		var itemObject = new Item[itemType.type]();

		itemObject.Model = itemType.model;
		itemObject.Script = itemType.script;
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(item[3]);

		// Windsock tag
		if (itemData === itemTags.WINDSOCK) {
			itemObject.createEntity();
		}
		// Beacon tag
		else if (itemData === itemTags.BEACON) {
			itemObject.createEntity();
		}

		return [itemObject];
	}

	// Make a stationary/static vehicle item
	function makeStaticVehicle(item) {

		var staticVehicles = makeStaticVehicle.data;

		// Build an indexed list of all static vehicles per country and type
		if (!makeStaticVehicle.data) {

			staticVehicles = makeStaticVehicle.data = {};

			for (var i = 0; i < data.vehicles.length; i++) {

				var vehicle = data.vehicles[i];

				if (!vehicle.static) {
					continue;
				}

				vehicle.countries.forEach(function(countryID) {

					if (!staticVehicles[countryID]) {
						staticVehicles[countryID] = {};
					}

					if (!staticVehicles[countryID][vehicle.type]) {
						staticVehicles[countryID][vehicle.type] = [];
					}

					staticVehicles[countryID][vehicle.type].push(vehicle);
				});
			}
		}

		// TODO: Pick from a list of countries with presence (from units)
		var countryID = 201;

		if (!staticVehicles[countryID]) {
			return;
		}

		var vehicleType;

		if (item[0] === itemTags.TRUCK_CARGO) {
			vehicleType = "truck_cargo";
		}
		else if (item[0] === itemTags.TRUCK_FUEL) {
			vehicleType = "truck_fuel";
		}

		if (!vehicleType || !staticVehicles[countryID][vehicleType]) {
			return;
		}

		// TODO: Limit number of static vehicles based on number of units on the airfield
		var randVehicle = mission.rand.pick(staticVehicles[countryID][vehicleType]);

		// Create static vehicle block item
		var itemObject = new Item.Block();

		// Slightly vary/randomize static vehicle position
		var positionX = Math.max(item[1] + mission.rand.real(-1, 1), 0);
		var positionZ = Math.max(item[2] + mission.rand.real(-1, 1), 0);

		// Slightly vary/randomize static vehicle orientation
		var orientation = Math.max((item[3] + mission.rand.real(-20, 20) + 360) % 360, 0);

		itemObject.Model = randVehicle.static.model;
		itemObject.Script = randVehicle.static.script;
		itemObject.setPosition(positionX, positionZ);
		itemObject.setOrientation(orientation);

		return [itemObject];
	}

	// Make anti-aircraft vehicle item
	function makeAAVehicle(item) {

		var itemObject = new Item.Vehicle();

		itemObject.Model = "graphics\\artillery\\mg34-aa\\mg34-aa.mgm";
		itemObject.Script = "LuaScripts\\WorldObjects\\vehicles\\mg34-aa.txt";
		// itemObject.Model = "graphics\\characters\\BotField_SoldierGER\\SoldierGER.MGM";
		// itemObject.Script = "LuaScripts\\WorldObjects\\bots\\botfield_soldierger.txt";
		itemObject.setPosition(item[1], item[2]);
		itemObject.setOrientation(item[3]);

		itemObject.createEntity();

		return [itemObject];
	}
};

module.exports.itemTags = itemTags;