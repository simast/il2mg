/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
var makeFlightElements = require("./flights.elements");
var makeFlightPlanes = require("./flights.planes");
var makeFlightTakeoff = require("./flights.takeoff");
var makeAirfieldTaxi = require("./airfields.taxi");

// Flight states
// NOTE: Numeric flight states represent aircraft in the air at various mission states
var flightState = makeFlight.flightState = {
	PARKED: "parked", // Parked, engine not running, cold start
	READY: "ready", // Parked, engine running, ready for taxi
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

	// Set default flight state (cold start from parking)
	if (flight.state === undefined) {
		flight.state = flightState.PARKED;
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
	
	// Option 3: Force air start state if no valid taxi route is found
	if (flight.taxi === undefined) {
		flight.state = 0;
	}
	
	// Pick a player plane
	// TODO: Support command-line argument for player leader/wingman selection
	if (isPlayer) {
		
		// 50% chance the player is a leader in a multi-plane flight formation
		if (flight.planes === 1 || rand.bool()) {
			flight.player = flight.leader;
		}
		// Player is a wingman
		else {
			flight.player = rand.pick(flight.elements[0], 1);
		}
	}
	
	// Create flight group item
	flight.group = this.createItem("Group");
	flight.group.setName(unit.name);
	
	// Set unique flight callsign
	flight.callsign = this.getCallsign("plane");

	// Make flight parts
	makeFlightPlanes.call(this, flight);
	makeFlightTakeoff.call(this, flight);

	// Enable airfield taxi route
	if (flight.taxi > 0) {
		makeAirfieldTaxi.call(this, airfield, flight.taxi);
	}
	
	return flight;
}

module.exports = makeFlight;