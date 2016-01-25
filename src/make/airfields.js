/** @copyright Simas Toleikis, 2015 */
"use strict";

const log = require("../log");
const Item = require("../item");

// Data constants
const itemTag = DATA.itemTag;
const planeSize = DATA.planeSize;

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
	const params = mission.params;
	const battle = mission.battle;
	const rand = mission.rand;

	// Min and max plane size IDs
	const planeSizeMin = planeSize.SMALL;
	const planeSizeMax = planeSize.HUGE;

	// Airfield index tables
	const airfields = Object.create(null);
	const airfieldsByCoalition = Object.create(null);

	// Total airfield counts
	let totalAirfields = 0;
	let totalActive = 0;
	
	// FIXME: Remove from this scope!
	let airfieldData;

	// Process each airfield
	for (const airfieldID in battle.airfields) {

		totalAirfields++;

		airfieldData = battle.airfields[airfieldID];
		const airfield = airfields[airfieldID] = Object.create(null);

		airfield.id = airfieldID;
		airfield.name = airfieldData.name;
		airfield.position = airfieldData.position;
		
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
			airfield.countries = Object.create(null);
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
			airfield.coalition = DATA.countries[airfield.country].coalition;

			if (!airfieldsByCoalition[airfield.coalition]) {
				airfieldsByCoalition[airfield.coalition] = [];
			}

			airfieldsByCoalition[airfield.coalition].push(airfield);

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
				
				const logData = Object.create(null);

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

						// Collect info when unitPlanes.length is greater than 0 (could not
						// distribute all unit planes - not enough parking spots).
						unitPlanes.forEach((planeData) => {
							
							const planeID = planeData[0];
							
							if (!logData[planeID]) {
								logData[planeID] = 0;
							}
							
							logData[planeID]++;
						});
					});
				}
				
				// Log a warning for each plane type (with number of planes) that could
				// not be distributed on the airfield (due to missing plane spots).
				for (const planeID in logData) {
					
					const logParams = {
						airfield: airfieldID
					};
					
					logParams[planeID] = logData[planeID];
					
					log.W("Not enough plane spots!", logParams);
				}
			})();
			
			// Show airfield icon with number of planes in debug mode
			if (mission.debug && mission.debug.airfields) {
				
				// NOTE: Icon text can only have a custom color if it is linked to another
				// icon. As a workaround - we are creating two icons at the same location.
				const airfieldIcon1 = airfield.group.createItem("MCU_Icon");
				const airfieldIcon2 = airfield.group.createItem("MCU_Icon");
				
				// TODO: Show icon at the edge of the map for off-map airfields
				airfieldIcon1.setPosition(airfield.position);
				airfieldIcon2.setPosition(airfield.position);
				
				airfieldIcon1.LineType = Item.MCU_Icon.LINE_BOLD;
				airfieldIcon1.setName(mission.getLC(airfield.planes + "\u2708"));
				airfieldIcon1.setColor(DATA.countries[airfield.country].color);
				
				airfieldIcon1.Coalitions = mission.coalitions;
				airfieldIcon2.Coalitions = mission.coalitions;
				
				airfieldIcon1.addTarget(airfieldIcon2);
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
				
				// Set item Y position to airfield Y position when the value is 0
				if (item[2] === 0) {
					item[2] = airfield.position[1];
				}

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
	
	// Enable not used taxi routes for all active airfields
	// NOTE: When the flights are created they will enable taxi routes that match
	// parking spots of the planes. The code below makes sure to enable the remaining
	// taxi routes for all active airfields that were not activated by flights code.
	mission.make.push(() => {

		for (const airfieldID in mission.airfields) {
			
			const airfield = mission.airfields[airfieldID];
			
			// Ignore airfields without taxi routes or with empty value (no active planes/units)
			if (!airfield.value || !airfield.taxi) {
				continue;
			}
			
			// Choose taxi routes randomly
			const taxiRoutes = rand.shuffle(Object.keys(airfield.taxi));
			
			for (const taxiRouteID of taxiRoutes) {
				
				const taxiRunwayID = airfield.taxi[taxiRouteID][1];
				
				// Enable one random taxi route for each runway
				if (!airfield.activeTaxiRoutes || !airfield.activeTaxiRoutes[taxiRunwayID]) {
					makeAirfieldTaxi.call(mission, airfield, +taxiRouteID);
				}
			}
		}
	});

	// Log mission airfields info
	log.I("Airfields:", totalAirfields, {active: totalActive});
};