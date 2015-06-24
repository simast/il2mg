/** @copyright Simas Toleikis, 2015 */
"use strict";

// Max supported plane count in zone area
var ZONE_MAX_PLANES = 6;

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
	var zoneCounter = zoneGroup.createItem("MCU_Counter");
	var zonePlus = zoneGroup.createItem("MCU_Timer");
	var zoneMinus = zoneGroup.createItem("MCU_Timer");
	var zoneMinusActivate = zoneGroup.createItem("MCU_Activate");
	var zoneMinusDeactivate = zoneGroup.createItem("MCU_Deactivate");
	var zoneMinusCounter = zoneGroup.createItem("MCU_Counter");
	var zoneMinusFirst = zoneGroup.createItem("MCU_Timer");
	var zoneMinusTick1 = zoneGroup.createItem("MCU_Timer");
	var zoneMinusTick2 = zoneGroup.createItem("MCU_Timer");
	var zoneMinusLast = zoneGroup.createItem("MCU_Timer");
	var zoneMinusCounterActivate = zoneGroup.createItem("MCU_Activate");
	var zoneMinusCounterDeactivate = zoneGroup.createItem("MCU_Deactivate");
	var zoneLoad = zoneGroup.createItem("MCU_Timer");
	var zoneLoadDeactivate = zoneGroup.createItem("MCU_Deactivate");
	var zoneLoadActivate = zoneGroup.createItem("MCU_Activate");
	var zoneActivate = zoneGroup.createItem("MCU_Activate");
	var zoneUnload = zoneGroup.createItem("MCU_Timer");
	var zoneUnloadActivate = zoneGroup.createItem("MCU_Activate");
	var zoneDeactivate = zoneGroup.createItem("MCU_Deactivate");

	zoneTrigger.setPosition(airfield.position);
	zoneTrigger.Radius = 6000;
	zoneTrigger.CheckEntities = 1;

	// Filter on used events
	zoneTrigger.EventsFilterSpawned = 1;
	zoneTrigger.EventsFilterEnteredSimple = 1;
	zoneTrigger.EventsFilterLeftSimple = 1;
	zoneTrigger.EventsFilterFinishedSimple = 1;

	// Map trigger events to zone +1 and -1 actions
	zoneTrigger.addEvent("OnObjectSpawned", zonePlus);
	zoneTrigger.addEvent("OnObjectEntered", zonePlus);
	zoneTrigger.addEvent("OnObjectLeft", zoneMinus);
	zoneTrigger.addEvent("OnObjectFinished", zoneMinus);
	
	// Setup main zone entity counter
	zoneCounter.Counter = ZONE_MAX_PLANES + 1;
	zoneCounter.Dropcount = 1;
	zoneCounter.addTarget(zoneUnload);

	// Zone plus entity action will directly trigger zone load event
	zonePlus.addTarget(zoneLoad);
	zonePlus.addTarget(zoneCounter);

	// Deactivate zone load event on first use
	zoneLoad.addTarget(zoneLoadDeactivate);
	zoneLoadDeactivate.addTarget(zoneLoad);

	// Activate zone load event again with unload event
	zoneUnload.addTarget(zoneLoadActivate);
	zoneLoadActivate.addTarget(zoneLoad);

	// Zone activate/deactivate events are fired after load/unload events
	zoneLoad.addTarget(zoneActivate);
	zoneUnload.addTarget(zoneDeactivate);

	// Setup zone minus target links
	zoneMinus.addTarget(zoneMinusDeactivate);
	zoneMinus.addTarget(zoneMinusCounterActivate);
	zoneMinus.addTarget(zoneMinusFirst);

	// Deactivate (freeze) zone minus/plus/unload events when entering decrement logic
	zoneMinusDeactivate.addTarget(zoneMinus);
	zoneMinusDeactivate.addTarget(zoneUnload);
	zoneMinusDeactivate.addTarget(zonePlus);

	// Activate (unfreeze) zone minus/plus events when leaving decrement logic
	zoneMinusActivate.addTarget(zoneMinus);
	zoneMinusActivate.addTarget(zonePlus);
	
	// Setup zone decrement counter
	zoneMinusCounter.Counter = ZONE_MAX_PLANES - 2;
	zoneMinusCounter.Dropcount = 1;
	zoneMinusCounter.addTarget(zoneMinusCounterDeactivate);
	zoneMinusCounter.addTarget(zoneMinusLast);
	zoneMinusCounter.addTarget(zoneUnloadActivate);

	// Setup zone decrement counter timers
	zoneMinusFirst.Time = 0.001; // 1ms
	zoneMinusTick1.Time = 0.02; // 20ms
	zoneMinusTick2.Time = 0.02; // 20ms
	zoneMinusLast.Time = 0.02; // 20ms
	zoneMinusFirst.addTarget(zoneCounter);
	zoneMinusFirst.addTarget(zoneMinusTick1);
	zoneMinusTick1.addTarget(zoneCounter);
	zoneMinusTick1.addTarget(zoneMinusTick2);
	zoneMinusTick1.addTarget(zoneMinusCounter);
	zoneMinusTick2.addTarget(zoneCounter);
	zoneMinusTick2.addTarget(zoneMinusTick1);
	zoneMinusTick2.addTarget(zoneMinusCounter);
	zoneMinusLast.addTarget(zoneCounter);
	zoneMinusLast.addTarget(zoneMinusActivate);
	
	// Setup zone decrement counter activation/deactivation
	zoneMinusCounterActivate.addTarget(zoneMinusTick1);
	zoneMinusCounterActivate.addTarget(zoneMinusTick2);
	zoneMinusCounterDeactivate.addTarget(zoneMinusTick1);
	zoneMinusCounterDeactivate.addTarget(zoneMinusTick2);
	
	// Reactivate unload event after decrement counter logic
	zoneUnloadActivate.addTarget(zoneUnload);

	// Position all other zone items near the trigger
	zoneInitialize.setPositionNear(zoneTrigger);
	zoneCounter.setPositionNear(zoneTrigger);
	zonePlus.setPositionNear(zoneTrigger);
	zoneMinus.setPositionNear(zoneTrigger);
	zoneMinusActivate.setPositionNear(zoneTrigger);
	zoneMinusDeactivate.setPositionNear(zoneTrigger);
	zoneMinusCounter.setPositionNear(zoneTrigger);
	zoneMinusFirst.setPositionNear(zoneTrigger);
	zoneMinusTick1.setPositionNear(zoneTrigger);
	zoneMinusTick2.setPositionNear(zoneTrigger);
	zoneMinusLast.setPositionNear(zoneTrigger);
	zoneMinusCounterActivate.setPositionNear(zoneTrigger);
	zoneMinusCounterDeactivate.setPositionNear(zoneTrigger);
	zoneLoad.setPositionNear(zoneTrigger);
	zoneLoadDeactivate.setPositionNear(zoneTrigger);
	zoneLoadActivate.setPositionNear(zoneTrigger);
	zoneActivate.setPositionNear(zoneTrigger);
	zoneUnload.setPositionNear(zoneTrigger);
	zoneUnloadActivate.setPositionNear(zoneTrigger);
	zoneDeactivate.setPositionNear(zoneTrigger);
	
	// Expose public zone event items
	zone.onInitialize = zoneInitialize;
	zone.onLoad = zoneLoad;
	zone.onActivate = zoneActivate;
	zone.onUnload = zoneUnload;
	zone.onDeactivate = zoneDeactivate;
};