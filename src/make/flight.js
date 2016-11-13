/** @copyright Simas Toleikis, 2015 */
"use strict";

const {flightState} = require("../data");

// Flight make parts
const makeFlightFormation = require("./flight.formation");
const makeFlightPilots = require("./flight.pilots");
const makeFlightPlanes = require("./flight.planes");
const makeFlightPlan = require("./flight.plan");
const makeFlightFuel = require("./flight.fuel");
const makeAirfieldTaxi = require("./airfield.taxi");

// Make mission flight
module.exports = function makeFlight(params) {

	const rand = this.rand;
	const flight = Object.create(null);

	// Validate required unit parameter
	if (!params.unit || !this.units[params.unit]) {
		throw new TypeError("Invalid flight unit ID value.");
	}

	// Validate optional task parameter
	if (params.task && !this.tasks[params.task]) {
		throw new TypeError("Invalid flight task value.");
	}

	let isPlayer = false;

	// Player flight
	if (params.player) {
		isPlayer = true;
	}

	let unitID = params.unit;

	// Resolve unit from unit group
	while (Array.isArray(this.units[unitID])) {
		unitID = rand.pick(this.units[unitID]);
	}

	const unit = this.units[unitID];
	const airfield = this.airfields[unit.airfield];
	const taskID = params.task;
	let task;

	// Try to find matching unit task by specified ID
	if (taskID) {

		for (const unitTask of rand.shuffle(unit.tasks)) {

			if (unitTask.id === taskID) {

				task = unitTask;
				break;
			}
		}
	}
	// Pick a random (weighted) unit task
	else {
		task = rand.pick(unit.tasks);
	}

	if (!task) {
		throw new Error("Invalid flight unit task.");
	}

	flight.task = task;
	flight.unit = unitID;
	flight.airfield = unit.airfield;
	flight.country = unit.country;
	flight.coalition = unit.coalition;
	flight.state = params.state;

	// Set default flight state (parking start without engine running)
	if (flight.state === undefined) {
		flight.state = flightState.START;
	}

	// Make flight formation (elements/sections)
	makeFlightFormation.call(this, flight, isPlayer);

	// No planes are available for the flight
	if (!flight.planes) {
		return;
	}

	// Cache of already known invalid sectors for this flight
	const invalidTaxiSectors = new Set();

	// Find flight taxi route (from a list of valid sectors)
	const findTaxiRoute = (sectors) => {

		for (const sector of sectors) {

			// Skip already validated sectors
			if (invalidTaxiSectors.has(sector)) {
				continue;
			}

			const taxiSpawns = airfield.taxiSpawnsBySector[sector];
			const validSpawns = [];
			let usePlayerOnlySpawns = false;

			// Use player-only spawn points with a single-plane player flight
			if (isPlayer && flight.planes === 1 && taxiSpawns[0]) {

				flight.taxi = 0;
				usePlayerOnlySpawns = true;
				validSpawns.push.apply(validSpawns, taxiSpawns[0]);
			}

			// Pick any taxi route where the flight fits the best
			const taxiRoutes = Object.keys(taxiSpawns).filter((value) => {
				return value > 0;
			});

			// Continue to another sector where unit planes are present
			if (!taxiRoutes.length && !validSpawns.length) {

				invalidTaxiSectors.add(sector);
				continue;
			}

			flight.sector = Number(sector);
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
	};

	// Attempt to pick taxi route/sector
	(() => {

		const unitPlaneItems = airfield.planeItemsByUnit[unitID];

		// 1: Pick taxi route from sectors where static unit planes are present
		if (unitPlaneItems) {

			const sectors = Object.keys(unitPlaneItems);

			if (flight.planes > 1) {

				// Sort sectors list by number of planes present
				sectors.sort((a, b) => {
					return unitPlaneItems[b].length - unitPlaneItems[a].length;
				});
			}
			else {
				rand.shuffle(sectors);
			}

			findTaxiRoute(sectors);
		}

		// 2: Pick taxi route from sectors where same plane group units are present
		if (flight.taxi === undefined) {

			const planeGroup = this.planes[flight.leader.plane].group;
			const planeGroupSectors = airfield.taxiSectorsByPlaneGroup[planeGroup];

			if (planeGroupSectors) {

				const sectors = Object.keys(planeGroupSectors);

				if (flight.planes > 1) {

					// Sort plane group sector list by number of planes present
					sectors.sort((a, b) => {
						return planeGroupSectors[b] - planeGroupSectors[a];
					});
				}
				else {
					rand.shuffle(sectors);
				}

				findTaxiRoute(sectors);
			}
		}

		// 3: Pick taxi route from any random sector
		if (flight.taxi === undefined) {
			findTaxiRoute(rand.shuffle(Object.keys(airfield.taxiSpawnsBySector)));
		}
	})();

	// Make sure the taxi route on the airfield is valid and exists
	if (flight.taxi && (!airfield.taxi || !airfield.taxi[flight.taxi])) {
		delete flight.taxi;
	}

	// NOTE: Randomize taxi spawns list as it's not fully randomized by this point
	// (due to groups usage in airfield data files).
	if (flight.spawns) {
		rand.shuffle(flight.spawns);
	}

	// Option 3: Force (forward to) air start state if no valid taxi route is found
	if (flight.taxi === undefined) {

		flight.state = (typeof flight.state === "number") ? flight.state : 0;

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
	flight.group.setName(task.id + " (" + unit.name + ")");

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
			taxiRoutes.sort((a, b) => {
				return (a.distance - b.distance);
			});

			const playerTaxiRouteID = taxiRoutes[0].id;

			// Enable airfield taxi route
			makeAirfieldTaxi.call(this, airfield, playerTaxiRouteID);

			// Use selected taxi route for player-only flight
			flight.taxi = -playerTaxiRouteID;
		}
	}

	// Make initial flight fuel
	makeFlightFuel.call(this, flight);

	// Make flight plan
	makeFlightPlan.call(this, flight);

	// Enable radio navigation beacon source
	if (isPlayer) {

		// Use player home airfield beacon by default
		let beaconItem = airfield.beacon;

		// Override with flight provided target beacon
		if (flight.beacon) {
			beaconItem = flight.beacon;
		}

		if (beaconItem) {

			const beaconItem = (flight.beacon || airfield.beacon);

			beaconItem.BeaconChannel = 1;
			beaconItem.entity.Enabled = 1;

			// Detach beacon item from airfield "bubble" zone
			if (airfield.zone) {

				airfield.zone.onActivate.removeObject(beaconItem);
				airfield.zone.onDeactivate.removeObject(beaconItem);
			}
		}
	}

	return flight;
};