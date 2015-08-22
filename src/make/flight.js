/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
var makeFlightElements = require("./flight.elements");
var makeFlightPilots = require("./flight.pilots");
var makeFlightPlanes = require("./flight.planes");
var makeFlightPlan = require("./flight.plan");
var makeAirfieldTaxi = require("./airfield.taxi");

// Data constants
var flightState = DATA.flightState;

// Make mission flight
function makeFlight(params) {

	// TODO: params.player - player flight flag (or player plane ID)
	// TODO: params.task - task ID
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

	// Resolve unit from unit group ID
	while (Array.isArray(this.unitsByID[unitID])) {
		unitID = rand.pick(this.unitsByID[unitID]);
	}
	
	var unit = this.unitsByID[unitID];
	var airfield = this.airfieldsByID[unit.airfield];
	
	flight.unit = unitID;
	flight.airfield = unit.airfield;
	flight.country = unit.country;
	flight.state = params.state;

	// Set default flight state (parking start without engine running)
	if (flight.state === undefined) {
		flight.state = flightState.START;
	}
	
	// Make flight elements (sections/formation)
	makeFlightElements.call(this, flight, params.formation);
	
	// No planes are available for the flight
	if (!flight.planes) {
		return;
	}

	// Flight plan actions list
	flight.plan = [];
	
	// Option 1: Attempt to pick taxi route/sector where static unit planes are present
	(function() {

		var unitPlaneItems = airfield.planeItemsByUnit[unitID];

		if (unitPlaneItems) {

			var unitSectors = Object.keys(unitPlaneItems);

			if (flight.planes > 1) {

				// Order the unit sector list by number of planes present
				unitSectors.sort(function(a, b) {
					return unitPlaneItems[b].length - unitPlaneItems[a].length;
				});
			}
			else {
				rand.shuffle(unitSectors);
			}

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

				flight.sector = unitSectorID;

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
					flight.sector = taxiSectorID;
				}
			}
		}).call(this);
	}

	// Make sure the taxi route on the airfield is valid and exists
	if (flight.taxi && !airfield.taxi[flight.taxi]) {
		delete flight.taxi;
	}
	
	// NOTE: Randomize taxi spawns list as it's not fully randomized by this point
	// (due to groups usage in airfield data files).
	if (flight.spawns) {
		rand.shuffle(flight.spawns);
	}
	
	// Option 3: Force (forward to) air start state if no valid taxi route is found
	if (flight.taxi === undefined) {
		flight.state = 0;
	}
	
	// Pick a player element and plane
	if (isPlayer) {

		var playerElement = rand.pick(flight.elements);

		playerElement.player = true;
		flight.player = rand.pick(playerElement);
	}
	
	// Create flight group item
	flight.group = this.createItem("Group");
	flight.group.setName(unit.name);
	
	// Set unique flight callsign
	flight.callsign = this.getCallsign("plane");
	
	// Make sure the callsign used for player flight is unique
	if (!isPlayer && this.player.flight) {
		
		var playerCallsign = this.player.flight.callsign;

		if (playerCallsign) {
			
			while (flight.callsign.id === playerCallsign.id) {
				flight.callsign = this.getCallsign("plane");
			}
		}
	}

	// Enable required airfield taxi route
	if (flight.taxi > 0) {
		makeAirfieldTaxi.call(this, airfield, flight.taxi);
	}

	// Make flight pilots and planes
	makeFlightPilots.call(this, flight);
	makeFlightPlanes.call(this, flight);
	
	// Enable closest airfield taxi route for player-only spawn point
	if (flight.taxi === 0) {
		
		var playerItem = flight.player.item;
		var taxiRoutes = [];
		
		// Build taxi route list with distances to player plane item
		for (var taxiRouteID in airfield.taxi) {
			
			var taxiRoute = airfield.taxi[taxiRouteID];
			var posXDiff = playerItem.XPos - taxiRoute[3][0];
			var posZDiff = playerItem.ZPos - taxiRoute[3][1];

			taxiRoutes.push({
				id: +taxiRouteID,
				distance: Math.sqrt(Math.pow(posXDiff, 2) + Math.pow(posZDiff, 2))
			});
		}
		
		if (taxiRoutes.length) {
		
			// Sort taxi routes based on shortest distance to player plane item
			taxiRoutes.sort(function(a, b) {
				return (a.distance - b.distance);
			});
			
			var playerTaxiRouteID = taxiRoutes[0].id;

			// Enable airfield taxi route
			makeAirfieldTaxi.call(this, airfield, playerTaxiRouteID);

			// Use selected taxi route for player-only flight
			flight.taxi = -playerTaxiRouteID;
		}
	}
	
	// Make flight plan
	makeFlightPlan.call(this, flight);
	
	// Enable radio beacon source for player home airfield
	if (isPlayer && this.beaconsByAirfield && this.beaconsByAirfield[airfield.id]) {
		
		var beaconItem = this.beaconsByAirfield[airfield.id];
		
		beaconItem.BeaconChannel = 1;
		beaconItem.entity.Enabled = 1;
		
		// Detach beacon item from airfield "bubble" zone
		airfield.zone.onActivate.removeObject(beaconItem);
		airfield.zone.onDeactivate.removeObject(beaconItem);
	}
	
	return flight;
}

module.exports = makeFlight;