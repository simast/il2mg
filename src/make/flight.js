/** @copyright Simas Toleikis, 2015 */
"use strict";

// Flight make parts
const makeFlightFormation = require("./flight.formation");
const makeFlightPilots = require("./flight.pilots");
const makeFlightPlanes = require("./flight.planes");
const makeFlightPlan = require("./flight.plan");
const makeAirfieldTaxi = require("./airfield.taxi");

// Data constants
const flightState = DATA.flightState;

// Make mission flight
function makeFlight(params) {

	const rand = this.rand;
	const flight = Object.create(null);

	// Validate required unit parameter
	if (!params.unit || !this.units[params.unit]) {
		throw new TypeError("Invalid flight unit ID value.");
	}
	
	// Validate required task parameter
	if (!params.task || !this.tasks[params.task]) {
		throw new TypeError("Invalid flight task value.");
	}
	
	let isPlayer = false;

	// Player flight
	// TODO: Support player param as a requested player plane ID
	if (params.player) {
		isPlayer = true;
	}

	let taskID = params.task;
	let unitID = params.unit;
	
	// Resolve task from task group
	while (Array.isArray(this.tasks[taskID])) {
		taskID = rand.pick(this.tasks[taskID]);
	}

	// Resolve unit from unit group
	while (Array.isArray(this.units[unitID])) {
		unitID = rand.pick(this.units[unitID]);
	}
	
	const unit = this.units[unitID];
	const airfield = this.airfields[unit.airfield];
	
	flight.task = taskID;
	flight.unit = unitID;
	flight.airfield = unit.airfield;
	flight.country = unit.country;
	flight.state = params.state;

	// Set default flight state (parking start without engine running)
	if (flight.state === undefined) {
		flight.state = flightState.START;
	}
	
	// Make flight formation (elements/sections)
	makeFlightFormation.call(this, flight);
	
	// No planes are available for the flight
	if (!flight.planes) {
		return;
	}
	
	// Option 1: Attempt to pick taxi route/sector where static unit planes are present
	(function() {

		const unitPlaneItems = airfield.planeItemsByUnit[unitID];
		
		if (!unitPlaneItems) {
			return;
		}
		
		const unitSectors = Object.keys(unitPlaneItems);

		if (flight.planes > 1) {

			// Order the unit sector list by number of planes present
			unitSectors.sort(function(a, b) {
				return unitPlaneItems[b].length - unitPlaneItems[a].length;
			});
		}
		else {
			rand.shuffle(unitSectors);
		}

		for (const unitSectorID of unitSectors) {

			const taxiSpawns = airfield.taxiSpawnsBySector[unitSectorID];
			const validSpawns = [];
			let usePlayerOnlySpawns = false;
			
			// Use player-only spawn points with a single-plane player flight
			if (isPlayer && flight.planes === 1 && taxiSpawns[0]) {
				
				flight.taxi = 0;
				usePlayerOnlySpawns = true;
				validSpawns.push.apply(validSpawns, taxiSpawns[0]);
			}
			
			// Pick any taxi route where the flight fits the best
			const taxiRoutes = Object.keys(taxiSpawns).filter(function(value) {
				return value > 0;
			});
			
			// Continue to another sector where unit planes are present
			if (!taxiRoutes.length && !validSpawns.length) {
				continue;
			}
			
			flight.sector = Number(unitSectorID);
			flight.spawns = validSpawns;
			
			if (taxiRoutes.length) {
				
				const taxiRoute = Number(rand.pick(taxiRoutes));
				
				if (usePlayerOnlySpawns) {
					validSpawns.push.apply(validSpawns, taxiSpawns[taxiRoute]);
				}
				else {
					
					flight.taxi = taxiRoute;
					flight.spawns = taxiSpawns[taxiRoute];
				}
			}
			
			break;
		}
	}).call(this);
	
	// Option 2: Attempt to pick any taxi route/sector where the same plane group units are present
	if (flight.taxi === undefined) {

		(function() {

			const leaderPlaneGroup = this.planes[flight.leader.plane].group;
			const leaderPlaneGroupTaxiSectors = airfield.taxiSectorsByPlaneGroup[leaderPlaneGroup];
			
			if (leaderPlaneGroupTaxiSectors) {

				const taxiSectorID = rand.pick(leaderPlaneGroupTaxiSectors);
				const taxiSpawns = airfield.taxiSpawnsBySector[taxiSectorID];

				const taxiRoutes = Object.keys(taxiSpawns).filter(function(value) {
					return value > 0;
				});
				
				if (taxiRoutes.length) {

					flight.taxi = Number(rand.pick(taxiRoutes));
					flight.sector = Number(taxiSectorID);
					flight.spawns = taxiSpawns[flight.taxi];
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
		
		// Also reset each individual element state
		for (const element of flight.elements) {
			element.state = flight.state;
		}
	}
	
	// Pick a player element and plane
	if (isPlayer) {

		const playerElement = rand.pick(flight.elements);

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
		
		const playerCallsign = this.player.flight.callsign;

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
		
		const playerItem = flight.player.item;
		const taxiRoutes = [];
		
		// Build taxi route list with distances to player plane item
		for (const taxiRouteID in airfield.taxi) {
			
			const taxiRoute = airfield.taxi[taxiRouteID];
			const posXDiff = playerItem.XPos - taxiRoute[3][0];
			const posZDiff = playerItem.ZPos - taxiRoute[3][1];

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
			
			const playerTaxiRouteID = taxiRoutes[0].id;

			// Enable airfield taxi route
			makeAirfieldTaxi.call(this, airfield, playerTaxiRouteID);

			// Use selected taxi route for player-only flight
			flight.taxi = -playerTaxiRouteID;
		}
	}
	
	// Make flight plan
	makeFlightPlan.call(this, flight);
	
	// Enable radio beacon source for player home airfield
	if (isPlayer && airfield.beacon) {
		
		const beaconItem = airfield.beacon;
		
		beaconItem.BeaconChannel = 1;
		beaconItem.entity.Enabled = 1;
		
		// Detach beacon item from airfield "bubble" zone
		airfield.zone.onActivate.removeObject(beaconItem);
		airfield.zone.onDeactivate.removeObject(beaconItem);
	}
	
	return flight;
}

module.exports = makeFlight;