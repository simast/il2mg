/** @copyright Simas Toleikis, 2015 */
"use strict";

// Make airfield zone ("bubble" activity trigger)
module.exports = function makeAirfieldZone(airfield) {

	if (!airfield.country) {
		return;
	}

	airfield.onLoad = airfield.group.createItem("MCU_TR_MissionBegin");
	airfield.onLoad.setPosition(airfield.position);

	var zone = airfield.zone = Object.create(null);

	zone.group = airfield.group.createItem("Group");
	zone.group.setName("ZONE");

	// Activity zone complex trigger item
	var complexTrigger = zone.group.createItem("MCU_TR_ComplexTrigger");

	complexTrigger.setPosition(airfield.position);
	complexTrigger.Radius = 6000;
	complexTrigger.CheckEntities = 1;

	// Filter on used events
	complexTrigger.EventsFilterSpawned = 1;
	complexTrigger.EventsFilterEnteredSimple = 1;
	complexTrigger.EventsFilterLeftSimple = 1;
	complexTrigger.EventsFilterFinishedSimple = 1;
};