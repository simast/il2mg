/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");

// Flight states
var flightStates = makeFlight.flightStates = {
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

	var rand = this.rand;
	var flight = Object.create(null);

	// Validate required unit parameter
	if (!params.unit || !this.unitsByID[params.unit]) {
		throw new TypeError("Invalid flight unit ID value.");
	}
	
	// Validate required plane count parameter
	if (!Number.isInteger(params.planes) || params.planes <= 0) {
		throw new TypeError("Invalid flight plane count value.");
	}
	
	flight.unit = params.unit;

	// Resolve unit groups
	while (Array.isArray(this.unitsByID[flight.unit])) {
		flight.unit = rand.pick(this.unitsByID[flight.unit]);
	}
	
	var isPlayer = false;
	
	// Player flight
	// TODO: Support player param as a requested player plane ID
	if (params.player) {
		isPlayer = true;
	}
	
	flight.state = params.state;
	
	// Set default flight state
	if (flight.state === undefined) {
		flight.state = flightStates.PARKED;
	}

	var unit = this.unitsByID[flight.unit];
	
	flight.planes = [];
	rand.shuffle(unit.planes);
	
	for (var i = 0; i < params.planes; i++) {
		
		// TODO: Pick planes based on mission type
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
	
	// Pick random leader plane
	flight.planes.leader = rand.pick(flight.planes);
	
	var airfield = this.airfieldsByID[unit.airfield];
	
	flight.airfield = unit.airfield;
	
	// TODO: Use airfield.planeItemsByUnit
	// TODO: Use airfield.taxiSpawnsBySector
	
	var unitPlaneItems = airfield.planeItemsByUnit[flight.unit];
	
	if (unitPlaneItems) {
		
		// Get a list of airfield sectors the unit is present on
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
			if (flight.taxi === undefined) {
				
				var taxiRoutes = [];
				for (var taxiRouteID in taxiSpawns) {
					
					if (taxiRouteID > 0) {
						taxiRoutes.push(taxiRouteID);
					}
				}
				
				if (!taxiRoutes.length) {
					continue;
				}
				
				// TODO: Check for the best taxi route for a given flight plane set
				flight.taxi = Number(rand.pick(taxiRoutes));
			}
			
			// Pick taxi route plane spawn points
			if (flight.taxi !== undefined) {
				
				flight.spawns = taxiSpawns[flight.taxi];
				break;
			}
		}
	}
	
	// Attempt to pick any sector/taxi route where the same plane group units are present
	if (flight.taxi === undefined) {

		var leaderPlaneGroup = this.planesByID[flight.planes.leader.id].group;
		var leaderPlaneGroupTaxiSectors = airfield.taxiSectorsByPlaneGroup[leaderPlaneGroup];
		
		if (leaderPlaneGroupTaxiSectors) {
			
			var taxiSectorID = rand.pick(leaderPlaneGroupTaxiSectors);
			var taxiSpawns = airfield.taxiSpawnsBySector[taxiSectorID];
			var taxiRoutes = [];
			
			for (var taxiRouteID in taxiSpawns) {
				
				if (taxiRouteID > 0) {
					taxiRoutes.push(taxiRouteID);
				}
			}
			
			if (taxiRoutes.length) {
				
				flight.taxi = Number(rand.pick(taxiRoutes));
				flight.spawns = taxiSpawns[flight.taxi];
			}
		}
	}
	
	// Force air start state if no valid taxi route is found
	if (flight.taxi === undefined) {
		flight.state = 0;
	}
	
	if (isPlayer) {
		flight.planes.player = rand.pick(flight.planes);
	}
	
	// Create all plane item objects
	flight.planes.forEach(function(plane) {
		
		var Plane = Item.Plane;
		var planeData = this.planesByID[plane.id];
		var planeObject = this.createItem("Plane");
	
		planeObject.setName(planeData.name);
		planeObject.setPosition(116323.32, 83.238, 102809.66);
		planeObject.setOrientation(0, 47.80, 11);
		planeObject.Script = planeData.script;
		planeObject.Model = planeData.model;
		planeObject.Country = unit.country;
		planeObject.StartInAir = Plane.START_PARKING;
	
		// Player plane item
		if (plane === flight.planes.player) {
			planeObject.AILevel = Plane.AI_PLAYER;
		}
		// AI plane item
		else {
			planeObject.AILevel = Plane.AI_NORMAL;
		}
	
		// Create plane entity
		planeObject.createEntity();
		
	}, this);
	
	return flight;
}

module.exports = makeFlight;