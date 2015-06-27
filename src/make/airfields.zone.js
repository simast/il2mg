/** @copyright Simas Toleikis, 2015 */
"use strict";

// Time to delay the unloading of airfield zone area
var ZONE_UNLOAD_TIME = 60 * 5; // 5 minutes

// Make airfield zone ("bubble" activity trigger)
module.exports = function makeAirfieldZone(airfield) {

	if (!airfield.country) {
		return;
	}

	var zone = airfield.zone = Object.create(null);

	var zoneGroup = zone.group = airfield.group.createItem("Group");
	zoneGroup.setName("ZONE");

	// Activity zone items
	var zoneInitialize = zoneGroup.createItem("MCU_TR_MissionBegin");
	var zoneTrigger = zoneGroup.createItem("MCU_TR_ComplexTrigger");
	var zonePlus = zoneGroup.createItem("MCU_Timer");
	var zoneMinus = zoneGroup.createItem("MCU_Timer");
	var zoneLoad = zoneGroup.createItem("MCU_Timer");
	var zoneLoadActivate = zoneGroup.createItem("MCU_Activate");
	var zoneLoadDeactivate = zoneGroup.createItem("MCU_Deactivate");
	var zoneActivate = zoneGroup.createItem("MCU_Activate");
	var zoneUnload = zoneGroup.createItem("MCU_Timer");
	var zoneUnloadActivate = zoneGroup.createItem("MCU_Activate");
	var zoneUnloadDeactivate = zoneGroup.createItem("MCU_Deactivate");
	var zoneUnloadActivateTimer = zoneGroup.createItem("MCU_Timer");
	var zoneDeactivate = zoneGroup.createItem("MCU_Deactivate");

	zoneTrigger.setPosition(airfield.position);
	zoneTrigger.Radius = 6000;
	zoneTrigger.CheckEntities = 1;

	// Filter on used events
	zoneTrigger.EventsFilterSpawned = 1;
	zoneTrigger.EventsFilterEnteredSimple = 1;
	zoneTrigger.EventsFilterLeftSimple = 1;
	zoneTrigger.EventsFilterFinishedSimple = 1;
	zoneTrigger.EventsFilterStationaryAndAlive = 1;
	zoneTrigger.EventsFilterTookOff = 1;

	// Map trigger events to zone plus and minus actions
	zoneTrigger.addEvent("OnObjectSpawned", zonePlus);
	zoneTrigger.addEvent("OnObjectEntered", zonePlus);
	zoneTrigger.addEvent("OnObjectStationaryAndAlive", zonePlus);
	zoneTrigger.addEvent("OnObjectTookOff", zonePlus);
	zoneTrigger.addEvent("OnObjectLeft", zoneMinus);
	zoneTrigger.addEvent("OnObjectFinished", zoneMinus);

	// Zone plus actions (trigger load and deactivate unload event)
	zonePlus.addTarget(zoneLoad);
	zonePlus.addTarget(zoneUnloadDeactivate);
	zoneUnloadDeactivate.addTarget(zoneUnload);

	// Deactivate zone load event on first use
	zoneLoad.addTarget(zoneLoadDeactivate);
	zoneLoadDeactivate.addTarget(zoneLoad);

	// Activate zone load event again with unload event
	zoneUnload.addTarget(zoneLoadActivate);
	zoneLoadActivate.addTarget(zoneLoad);

	// Zone activate/deactivate events are fired after load/unload events
	zoneLoad.addTarget(zoneActivate);
	zoneUnload.addTarget(zoneDeactivate);

	// Zone minus actions (activate unload event and shedulle delayed unload action)
	zoneMinus.addTarget(zoneUnloadActivate);
	zoneMinus.addTarget(zoneUnloadActivateTimer);
	zoneUnloadActivateTimer.Time = 0.001; // 1ms
	zoneUnloadActivate.addTarget(zoneUnload);
	zoneUnloadActivateTimer.addTarget(zoneUnload);
	
	// Delay time for unload action
	zoneUnload.Time = ZONE_UNLOAD_TIME;

	// Position all other zone items near the trigger
	zoneInitialize.setPositionNear(zoneTrigger);
	zonePlus.setPositionNear(zoneTrigger);
	zoneMinus.setPositionNear(zoneTrigger);
	zoneLoad.setPositionNear(zoneTrigger);
	zoneLoadActivate.setPositionNear(zoneTrigger);
	zoneLoadDeactivate.setPositionNear(zoneTrigger);
	zoneActivate.setPositionNear(zoneTrigger);
	zoneUnload.setPositionNear(zoneTrigger);
	zoneUnloadActivate.setPositionNear(zoneTrigger);
	zoneUnloadDeactivate.setPositionNear(zoneTrigger);
	zoneUnloadActivateTimer.setPositionNear(zoneTrigger);
	zoneDeactivate.setPositionNear(zoneTrigger);
	
	// Expose public zone event items
	zone.onInitialize = zoneInitialize;
	zone.onLoad = zoneLoad;
	zone.onActivate = zoneActivate;
	zone.onUnload = zoneUnload;
	zone.onDeactivate = zoneDeactivate;
};