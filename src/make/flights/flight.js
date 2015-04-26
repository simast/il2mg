/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
var makeFlightPlanes = require("./planes");
var makeFlightTakeoff = require("./takeoff");

// Flight states
var flightState = makeFlight.flightState = {
	PARKED: "parked",
	TAXI: "taxi",
	RUNWAY: "runway"
};

// Make mission flight
function makeFlight(params) {

	// TODO: params.player - player flight flag (or player plane ID)
	// TODO: params.mission - mission ID
	// TODO: params.unit - unit ID
	// TODO: params.planes - number of planes
	// TODO: params.state - state (parked, runway, in progress, etc)
	// TODO: params.start - start when mission starts or at a later point in time

	var mission = this;
	var rand = mission.rand;
	var flight = Object.create(null);

	// Validate required unit parameter
	if (!params.unit || !mission.unitsByID[params.unit]) {
		throw new TypeError("Invalid flight unit ID value.");
	}
	
	// Validate required plane count parameter
	if (!Number.isInteger(params.planes) || params.planes <= 0) {
		throw new TypeError("Invalid flight plane count value.");
	}

	flight.unit = params.unit;

	// Resolve unit group IDs
	while (Array.isArray(mission.unitsByID[flight.unit])) {
		flight.unit = rand.pick(mission.unitsByID[flight.unit]);
	}
	
	var unit = mission.unitsByID[flight.unit];
	var airfield = mission.airfieldsByID[unit.airfield];
	var isPlayer = false;

	// Player flight
	// TODO: Support player param as a requested player plane ID
	if (params.player) {
		isPlayer = true;
	}
	
	flight.state = params.state;

	// Set default flight state (from parking)
	if (flight.state === undefined) {
		flight.state = flightState.PARKED;
	}
	
	flight.airfield = unit.airfield;
	flight.planes = [];
	
	rand.shuffle(unit.planes);
	
	// Pick available and required number of unit planes
	for (var i = 0; i < params.planes; i++) {

		// TODO: Pick planes required by mission type
		var plane = unit.planes.shift();

		if (!plane) {
			break;
		}
		
		flight.planes.push({
			id: plane
		});
	}
	
	// No planes are available for the flight
	if (!flight.planes.length) {
		return;
	}
	
	// The first plane in the list is the leader plane
	// TODO: Leaders should pick the best plane in the flight
	var leaderPlane = flight.planes[0];
	
	// Option 1: Attempt to pick taxi route/sector where static unit planes are present
	(function() {

		var unitPlaneItems = airfield.planeItemsByUnit[flight.unit];

		if (unitPlaneItems) {

			var unitSectors = Object.keys(unitPlaneItems);

			// Order the unit sector list by number of planes present
			unitSectors.sort(function(a, b) {
				return unitPlaneItems[b].length - unitPlaneItems[a].length;
			});

			for (var unitSectorID of unitSectors) {

				var taxiSpawns = airfield.taxiSpawnsBySector[unitSectorID];

				// 75% chance to use player-only spawn point with a single-plane player flight
				if (isPlayer && flight.planes.length === 1 && taxiSpawns[0] && rand.bool(0.75)) {
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
	})();

	// Option 2: Attempt to pick any taxi route/sector where the same plane group units are present
	if (flight.taxi === undefined) {

		(function() {

			var leaderPlaneGroup = mission.planesByID[leaderPlane.id].group;
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
		})();
	}
	
	// Option 3: Force air start state if no valid taxi route is found
	if (flight.taxi === undefined) {
		flight.state = 0;
	}
	
	// Pick player plane
	if (isPlayer) {
		flight.planes.player = rand.pick(flight.planes);
	}
	
	// Create flight group item
	flight.group = mission.createItem("Group");
	flight.group.setName(unit.name);
	
	// Make flight parts
	makeFlightPlanes.call(this, flight);
	makeFlightTakeoff.call(this, flight);
	
	return flight;
}

module.exports = makeFlight;