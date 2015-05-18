/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight states
// NOTE: Numeric (0..1) flight states represent aircraft in the air at various mission states
var flightState = makeFlight.flightState = {
	START: "start", // Parking, engine not running
	READY: "ready", // Parking, engine running, ready for taxi
	TAXI: "taxi", // On the taxiway, engine running, taxiing to runway
	RUNWAY: "runway" // On the runway, engine running, ready for takeoff
};

// Make mission flight
function makeFlight(params) {

	// TODO: params.player - player flight flag (or player plane ID)
	// TODO: params.mission - mission ID
	// TODO: params.unit - unit ID
	// TODO: params.state - state (parked, runway, in progress, etc)
	// TODO: params.start - start when mission starts or at a later point in time

	var rand = this.rand;
	var flight = Object.create(null);

	// Validate required unit parameter
	if (!params.unit || !this.unitsByID[params.unit]) {
		throw new TypeError("Invalid flight unit ID value.");
	}
	
	var isPlayer = false;

	// Player flight
	// TODO: Support player param as a requested player plane ID
	if (params.player) {
		isPlayer = true;
	}

	var unitID = params.unit;

	// Resolve unit group IDs
	while (Array.isArray(this.unitsByID[unitID])) {
		unitID = rand.pick(this.unitsByID[unitID]);
	}
	
	var unit = this.unitsByID[unitID];
	var airfield = this.airfieldsByID[unit.airfield];
	
	flight.unit = unitID;
	flight.airfield = unit.airfield;
	flight.state = params.state;
	flight.mission = params.mission;

	// Set default flight state (parking start without engine running)
	if (flight.state === undefined) {
		flight.state = flightState.START;
	}
	
	// Make flight elements (sections)
	makeFlightElements.call(this, flight);
	
	// No planes are available for the flight
	if (!flight.planes) {
		return;
	}
	
	// Option 1: Attempt to pick taxi route/sector where static unit planes are present
	(function() {

		var unitPlaneItems = airfield.planeItemsByUnit[unitID];

		if (unitPlaneItems) {

			var unitSectors = Object.keys(unitPlaneItems);

			// Order the unit sector list by number of planes present
			unitSectors.sort(function(a, b) {
				return unitPlaneItems[b].length - unitPlaneItems[a].length;
			});

			for (var unitSectorID of unitSectors) {

				var taxiSpawns = airfield.taxiSpawnsBySector[unitSectorID];

				// 75% chance to use player-only spawn point with a single-plane player flight
				if (isPlayer && flight.planes === 1 && taxiSpawns[0] && rand.bool(0.75)) {
					flight.taxi = 0;
				}
				// Pick any taxi route where the flight fits the best
				else {

					var taxiRoutes = Object.keys(taxiSpawns).filter(function(value) {
						return value > 0;
					});

					if (!taxiRoutes.length) {
						continue;
					}

					// TODO: Check for the best taxi route for a given flight plane set
					flight.taxi = Number(rand.pick(taxiRoutes));
				}

				// Pick taxi route plane spawn points
				flight.spawns = taxiSpawns[flight.taxi];
				break;
			}
		}
	}).call(this);

	// Option 2: Attempt to pick any taxi route/sector where the same plane group units are present
	if (flight.taxi === undefined) {

		(function() {

			var leaderPlaneGroup = this.planesByID[flight.leader.plane].group;
			var leaderPlaneGroupTaxiSectors = airfield.taxiSectorsByPlaneGroup[leaderPlaneGroup];
			
			if (leaderPlaneGroupTaxiSectors) {

				var taxiSectorID = rand.pick(leaderPlaneGroupTaxiSectors);
				var taxiSpawns = airfield.taxiSpawnsBySector[taxiSectorID];

				var taxiRoutes = Object.keys(taxiSpawns).filter(function(value) {
					return value > 0;
				});
				
				if (taxiRoutes.length) {

					flight.taxi = Number(rand.pick(taxiRoutes));
					flight.spawns = taxiSpawns[flight.taxi];
				}
			}
		}).call(this);
	}

	// Make sure the taxi route on the airfield is valid and exists
	if (flight.taxi && !airfield.taxi[flight.taxi]) {
		delete flight.taxi;
	}
	
	// Option 3: Force (forward to) air start state if no valid taxi route is found
	if (flight.taxi === undefined) {
		flight.state = 0;
	}
	
	// Pick a player plane
	if (isPlayer) {
		flight.player = rand.pick(rand.pick(flight.elements));
	}
	
	// Create flight group item
	flight.group = this.createItem("Group");
	flight.group.setName(unit.name);
	
	// Set unique flight callsign
	flight.callsign = this.getCallsign("plane");

	// Enable airfield taxi route
	if (flight.taxi > 0) {
		makeAirfieldTaxi.call(this, airfield, flight.taxi);
	}

	// Make flight parts
	makeFlightPilots.call(this, flight);
	makeFlightPlanes.call(this, flight);
	makeFlightPlan.call(this, flight);
	
	// TODO: Move to plan script files
	for (var element of flight.elements) {

		// Set element air start
		if (typeof element.state === "number") {

			var orientation = rand.integer(0, 360);

			for (var plane of element) {

				var planeItem = plane.item;

				// TODO: Set orientation and tweak spawn distance
				// TODO: Set formation?
				var positionX = airfield.position[0] + rand.integer(150, 350);
				var positionY = airfield.position[1] + rand.integer(250, 350);
				var positionZ = airfield.position[2] + rand.integer(150, 350);

				// Set plane item air start position and orientation
				planeItem.setPosition(positionX, positionY, positionZ);
				planeItem.setOrientation(orientation);
			}

			continue;
		}

		if (flight.taxi) {

			var missionBegin = flight.group.createItem("MCU_TR_MissionBegin");
			var takeoffCommand = flight.group.createItem("MCU_CMD_TakeOff");
		
			missionBegin.setPositionNear(element[0].item);
			missionBegin.addTarget(takeoffCommand);
	
			takeoffCommand.setPositionNear(missionBegin);
			takeoffCommand.setPosition(
				takeoffCommand.XPos,
				takeoffCommand.YPos + 500,
				takeoffCommand.ZPos
			);
			
			takeoffCommand.addObject(element[0].item);
		}
	}
	
	return flight;
}

module.exports = makeFlight;

// Flight make parts
var makeFlightElements = require("./flights.elements");
var makeFlightPilots = require("./flights.pilots");
var makeFlightPlanes = require("./flights.planes");
var makeFlightPlan = require("./flights.plan");
var makeAirfieldTaxi = require("./airfields.taxi");