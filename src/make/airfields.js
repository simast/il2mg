/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");
const log = require("../log");
const Item = require("../item");

// Data constants
const itemTag = data.itemTag;
const planeSize = data.planeSize;
const flightState = data.flightState;

// Airfield make parts
const makeAirfieldLimits = require("./airfield.limits");
const makeAirfieldStatic = require("./airfield.static");
const makeAirfieldPlane = require("./airfield.plane");
const makeAirfieldBeacon = require("./airfield.beacon");
const makeAirfieldWindsock = require("./airfield.windsock");
const makeAirfieldEffect = require("./airfield.effect");
const makeAirfieldWreck = require("./airfield.wreck");
const makeAirfieldVehicle = require("./airfield.vehicle");
const makeAirfieldRoutes = require("./airfield.routes");
const makeAirfieldZone = require("./airfield.zone");
const makeAirfieldTaxi = require("./airfield.taxi");

// Generate mission airfields
module.exports = function makeAirfields() {

	const mission = this;
	const battle = mission.battle;
	const rand = mission.rand;

	// Min and max plane size IDs
	const planeSizeMin = planeSize.SMALL;
	const planeSizeMax = planeSize.HUGE;

	// Airfield index tables
	const airfields = Object.create(null);
	const airfieldsByCoalition = Object.create(null);
	const airfieldsTaxi = new Set();
	
	// Offmap "hot" spots by coalition (based on offmap airfield positions)
	const offmapSpotsByCoalition = Object.create(null);

	// Total airfield counts
	let totalAirfields = 0;
	let totalActive = 0;
	let totalOffmap = 0;
	
	// FIXME: Remove from this scope!
	let airfieldData;

	// Process each airfield
	for (const airfieldID in battle.airfields) {

		totalAirfields++;
		
		airfieldData = battle.airfields[airfieldID];
		
		// Load airfield JSON data file
		try {
			
			Object.assign(
				airfieldData,
				require(this.battlePath + "airfields/" + airfieldID)
			);
		}
		catch (e) {}
		
		const airfield = airfields[airfieldID] = Object.create(null);

		airfield.id = airfieldID;
		airfield.name = airfieldData.name;
		const position = airfield.position = airfieldData.position;
		
		// Identify offmap airfield
		if (position[0] < 0 || position[0] > this.map.height ||
				position[2] < 0 || position[2] > this.map.width) {
			
			airfield.offmap = true;
			totalOffmap++;
		}
		
		// Getter for airfield items group
		Object.defineProperty(airfield, "group", {
			get: function() {
				
				// Lazy (first time access) initialization of group item
				delete this.group;
				
				this.group = mission.createItem("Group");
				this.group.setName(this.name);
				
				return this.group;
			},
			configurable: true
		});

		const airfieldUnits = mission.unitsByAirfield[airfieldID];

		// Process airfield units
		if (airfieldUnits) {

			const sectorsIndex = Object.create(null);
			const planesIndex = Object.create(null);
			const countries = Object.create(null);

			airfield.value = 0;
			airfield.planes = 0;
			airfield.taxi = airfieldData.taxi;
			airfield.countries = [];
			airfield.countriesWeighted = []; // List of country IDs as a weighted array
			airfield.planesBySector = Object.create(null);
			airfield.planeItemsByUnit = Object.create(null);
			airfield.taxiSpawnsBySector = Object.create(null);
			airfield.taxiSectorsByPlaneGroup = Object.create(null);

			// Process unit planes list
			for (const unitID in airfieldUnits) {

				const unit = airfieldUnits[unitID];
				const groupID = unit.group;

				unit.planes.forEach((planeID) => {

					const plane = mission.planes[planeID];
					const planeSizeID = planeSize[String(plane.size).toUpperCase()];

					if (planeSizeID) {

						// Airfield value is a sum of plane size IDs (with larger planes
						// adding more value than smaller ones)
						airfield.value += planeSizeID;

						// Register unit plane country data
						airfield.countriesWeighted.push(unit.country);
						countries[unit.country] = (countries[unit.country] || 0) + 1;

						// Build a list of plane groups indexed by plane size
						const planeSizeGroup = planesIndex[planeSizeID] = planesIndex[planeSizeID] || {};
						const planeGroup = planeSizeGroup[groupID] = planeSizeGroup[groupID] || [];

						planeGroup.push([planeID, unit.country, unitID]);
					}
					
					airfield.planes++;
				});
			}

			// Airfield countries list
			airfield.countries = Object.keys(countries).map(Number);

			// Sort countries list by number of units present on the airfield
			airfield.countries.sort((a, b) => {
				return countries[b] - countries[a];
			});

			// Airfield main country
			airfield.country = airfield.countries[0];

			// Airfield coalition
			airfield.coalition = data.countries[airfield.country].coalition;

			// Index airfield by coalition
			if (!airfieldsByCoalition[airfield.coalition]) {
				airfieldsByCoalition[airfield.coalition] = [];
			}

			airfieldsByCoalition[airfield.coalition].push(airfield);
			
			// Index offmap spots by coalition
			if (airfield.offmap) {
				
				if (!offmapSpotsByCoalition[airfield.coalition]) {
					offmapSpotsByCoalition[airfield.coalition] = [];
				}
				
				offmapSpotsByCoalition[airfield.coalition].push([
					airfield.position[0],
					airfield.position[2]
				]);
			}

			// Build a list of sectors indexed by plane size
			for (const sectorID in airfieldData.sectors) {

				for (const planeSizeID in airfieldData.sectors[sectorID]) {

					const maxPlanes = getSectorMaxPlanes(sectorID, planeSizeID);
					const sectorsByPlaneSize = sectorsIndex[planeSizeID] || [];

					if (maxPlanes > 0) {
						sectorsByPlaneSize.push(sectorID);
					}

					sectorsIndex[planeSizeID] = sectorsByPlaneSize;
				}
			}

			// Assign planes to sectors
			(() => {

				// NOTE: During distribution large size planes take priority over small size
				for (let planeSizeID = planeSizeMax; planeSizeID >= planeSizeMin; planeSizeID--) {

					const planesBySize = planesIndex[planeSizeID];

					if (!planesBySize) {
						continue;
					}

					// TODO: Sort unit list by plane group size
					rand.shuffle(Object.keys(planesBySize)).forEach((unitID) => {

						const unitPlanes = planesBySize[unitID];
						const planeSizeSectors = sectorsIndex[planeSizeID];

						if (planeSizeSectors) {

							// Sort indexed list of sectors by best fit for plane size
							planeSizeSectors.sort((a, b) => {

								const sectorSizeA = getSectorMaxPlanes(a, planeSizeID);
								const sectorSizeB = getSectorMaxPlanes(b, planeSizeID);

								return sectorSizeB - sectorSizeA;
							});

							for (let i = 0; i < planeSizeSectors.length; i++) {

								if (!unitPlanes.length) {
									break;
								}

								const sectorID = planeSizeSectors[i];
								const sectorMaxPlanes = getSectorMaxPlanes(sectorID, planeSizeID);
								const sectorPlanes = airfield.planesBySector[sectorID] = airfield.planesBySector[sectorID] || {};

								for (let n = 0; n < sectorMaxPlanes; n++) {

									const plane = unitPlanes.shift();
									const sector = airfieldData.sectors[sectorID];
									let sectorPlaneSize = [];

									for (let x = planeSizeID; x <= planeSizeMax; x++) {

										if (sector[x] > 0) {
											sectorPlaneSize.push(x);
										}
									}

									// Assign plane to sector plane parking spot
									sectorPlaneSize = rand.pick(sectorPlaneSize);
									sectorPlanes[sectorPlaneSize] = sectorPlanes[sectorPlaneSize] || [];
									sectorPlanes[sectorPlaneSize].push(plane);

									// Decrease sector plane spot count
									sector[sectorPlaneSize]--;

									if (!unitPlanes.length) {
										break;
									}
								}
							}
						}
					});
				}
			})();
			
			// Show airfield icon with number of planes in debug mode
			if (mission.debug && mission.debug.airfields && !airfield.offmap) {
				
				// NOTE: Icon text can only have a custom color if it is linked to another
				// icon. As a workaround - we are creating two icons at the same location.
				const airfieldIcon1 = airfield.group.createItem("MCU_Icon");
				const airfieldIcon2 = airfield.group.createItem("MCU_Icon");
				
				// TODO: Show icon at the edge of the map for off-map airfields
				airfieldIcon1.setPosition(position);
				airfieldIcon2.setPosition(position);
				
				airfieldIcon1.LineType = Item.MCU_Icon.LINE_BOLD;
				airfieldIcon1.setName(mission.getLC(airfield.planes + "\u2708"));
				airfieldIcon1.setColor(data.countries[airfield.country].color);
				
				airfieldIcon1.Coalitions = mission.coalitions;
				airfieldIcon2.Coalitions = mission.coalitions;
				
				airfieldIcon1.addTarget(airfieldIcon2);
			}

			// Mark airfield to be enabled/activated for taxi
			if (!airfield.offmap && airfield.value && airfield.taxi) {
				airfieldsTaxi.add(airfield);
			}
			
			totalActive++;
		}

		// Skip/continue if airfield has no items available
		if (!airfieldData.items || !airfieldData.items.length) {
			continue;
		}

		// Make airfield zone
		makeAirfieldZone.call(mission, airfield);

		// Make airfield item limits
		makeAirfieldLimits.call(mission, airfield);

		// Make airfield vehicle routes
		makeAirfieldRoutes.call(mission, airfield, airfieldData.routes);

		// Walk/process each airfield item
		(function walkItems(items, isGroup) {

			// Used to delay normal item insertion until any of the special items
			// were included in a group. If no special items are used - all normal
			// items in a group are also not included. This allows to group, for
			// example, an anti-aircraft special item together with a normal decoration
			// item, but if the AA special item is not used - the AA decoration item
			// is also not included.
			const extraItems = [];
			let useExtraItems = false;

			items.forEach((item) => {

				const itemTypeID = item[0];

				// Process item group
				if (Array.isArray(itemTypeID)) {

					rand.shuffle(item);

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						walkItems(item, true);
					}

					return;
				}

				let itemObjects = null;

				// Normal static item
				if (itemTypeID >= 0) {

					if (isGroup) {
						extraItems.push(item);
					}
					else {
						itemObjects = makeAirfieldStatic.call(mission, airfield, item);
					}
				}
				// Special item
				else {

					// Plane item
					if (itemTypeID === itemTag.PLANE) {
						itemObjects = makeAirfieldPlane.call(mission, airfield, item);
					}
					// Beacon item
					else if (itemTypeID === itemTag.BEACON) {
						itemObjects = makeAirfieldBeacon.call(mission, airfield, item);
					}
					// Windsock item
					else if (itemTypeID === itemTag.WINDSOCK) {
						itemObjects = makeAirfieldWindsock.call(mission, airfield, item);
					}
					// Effect item
					else if (itemTypeID === itemTag.EFFECT) {
						itemObjects = makeAirfieldEffect.call(mission, airfield, item);
					}
					// Wreck item
					else if (itemTypeID === itemTag.WRECK) {
						itemObjects = makeAirfieldWreck.call(mission, airfield, item);
					}
					// Vehicle item
					else {
						itemObjects = makeAirfieldVehicle.call(mission, airfield, item);
					}

					// Use all extra normal items in a group if special item is used
					if (itemObjects && itemObjects.length) {
						useExtraItems = true;
					}
				}

				// Add generated item objects to airfield group
				if (Array.isArray(itemObjects) && itemObjects.length) {

					itemObjects.forEach((itemObject) => {

						if (itemObject instanceof Item) {
							airfield.group.addItem(itemObject);
						}
					});
				}
			});

			// Include extra items
			if (useExtraItems && extraItems.length) {
				walkItems(extraItems, false);
			}

		})(rand.shuffle(airfieldData.items), false);
	}

	// Get max sector plane count by plane size
	function getSectorMaxPlanes(sectorID, planeSizeID) {

		let planeCount = 0;

		for (let i = planeSizeID; i <= planeSizeMax; i++) {
			planeCount += airfieldData.sectors[sectorID][i];
		}

		return planeCount;
	}

	// Static airfield data index objects
	mission.airfields = Object.freeze(airfields);
	mission.airfieldsByCoalition = Object.freeze(airfieldsByCoalition);
	mission.offmapSpotsByCoalition = Object.freeze(offmapSpotsByCoalition);
	
	// Enable not used taxi routes for all active airfields
	// NOTE: When the flights are created they will enable taxi routes that match
	// parking spots of the planes. The code below makes sure to enable the remaining
	// taxi routes for all active airfields that were not activated by flights.
	mission.make.push(() => {
		
		const playerFlight = this.player.flight;
		
		for (const airfield of airfieldsTaxi) {
			
			// Choose taxi routes randomly
			const taxiRoutes = rand.shuffle(Object.keys(airfield.taxi));
			
			for (const taxiRouteID of taxiRoutes) {
				
				const taxiRunwayID = airfield.taxi[taxiRouteID][1];
				
				// Enable one random taxi route for each runway
				if (!airfield.activeTaxiRoutes || !airfield.activeTaxiRoutes[taxiRunwayID]) {
					
					// FIXME: Nearest airfield item is used with takeoff command and this
					// could result in wrong taxi route being activated when player flight
					// is starting from runway and not from parking spot. An ideal fix
					// would be to move player created airfield taxi route to the runway.
					if (airfield.id === playerFlight.airfield &&
							playerFlight.state === flightState.RUNWAY) {
						
						break;
					}
					
					makeAirfieldTaxi.call(mission, airfield, +taxiRouteID);
				}
			}
		}
	});

	// Log mission airfields info
	log.I("Airfields:", totalAirfields, {
		offmap: totalOffmap,
		active: totalActive
	});
};