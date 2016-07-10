/** @copyright Simas Toleikis, 2016 */
"use strict";

module.exports = function(grunt) {
	
	// Grunt task used to build battle index database
	grunt.registerTask("build:index", "Build index database JSON files.", () => {

		const Vector = require("sylvester").Vector;
		const numeral = require("numeral");
		const moment = require("moment");
		const data = require("../../src/data");
		
		let totalBattles = 0;
		let totalUnits = 0;
		
		// Build plane data indexes
		const planeGroupIndex = Object.create(null);
		const planeTaskIndex = Object.create(null);
		
		for (const planeID in data.planes) {
			
			let planeData = data.planes[planeID];
			
			// Ignore dummy plane definitions (and groups used to catalog planes)
			if (!planeData || typeof planeData !== "object" || !planeData.name ||
				!planeData.model || !planeData.script) {
				
				continue;
			}
			
			// Register plane parent/group index hierarchy
			while (planeData) {
				
				// Build an index of valid plane tasks (based on type)
				if (planeData.type && !planeTaskIndex[planeID]) {
					
					const validTasks = [];
					
					for (const taskID in data.tasks) {
						for (const planeType in data.tasks[taskID].planes) {
							
							if (planeData.type.indexOf(planeType) >= 0) {
								
								validTasks.push(taskID);
								break;
							}
						}
					}
					
					planeTaskIndex[planeID] = validTasks;
				}
				
				const planeParentID = planeData.parent;
				
				if (!planeParentID) {
					break;
				}
				
				planeData = data.planes[planeParentID];
				
				if (!planeData.model && !planeData.script) {
					
					const planeGroup = planeGroupIndex[planeParentID] || [];
					
					planeGroup.push(planeID);
					planeGroupIndex[planeParentID] = planeGroup;
				}
			}
		}
		
		// Process units for each battle
		for (const battleID in data.battles) {
			
			const battle = data.battles[battleID];
			const battleFrom = moment(battle.from);
			const battleTo = moment(battle.to);
			const seasonIndex = Object.create(null);
			const datesIndex = Object.create(null);
			let lastRecordKey = 0;
			
			// Build an indexed list of airfields for ground/air start
			const airfieldsIndex = Object.create(null);
			
			for (const airfieldID in battle.airfields) {
				
				const airfield = battle.airfields[airfieldID];
				const position = airfield.position;
				let startType = 0; // Onmap air start
				
				// Check for offmap airfields
				if (position[0] < 0 || position[0] > battle.map.height ||
					position[2] < 0 || position[2] > battle.map.width) {
					
					startType = -1; // Offmap air start
				}
				
				// Mark airfields with taxi routes (for ground starts)
				if (airfield.taxi && Object.keys(airfield.taxi).length) {
					startType = 1; // Onmap ground start
				}
				
				airfieldsIndex[airfieldID] = startType;
			}
			
			const json = {
				name: battle.name
			};
			
			// Initialize battle index JSON structure
			[
				"countries",
				"units",
				"airfields",
				"planes",
				"tasks",
				"records",
				"seasons",
				"dates"
			].forEach((dataType) => {
				json[dataType] = Object.create(null);
			});
			
			// Process all battle units and build index data
			for (const unitID in battle.units) {
				
				let unitData = battle.units[unitID];

				// Ignore dummy unit definitions (and groups used to catalog units)
				if (!unitData || !unitData.name) {
					continue;
				}
				
				const unitCountry = unitData.country;
				const unitName = unitData.name;
				let unitFrom = battleFrom;
				let unitTo = battleTo;
				let unitSuffix;
				let unitAlias;
				
				if (unitData.from) {
					unitFrom = moment(unitData.from);
				}
				
				if (unitData.to) {
					unitTo = moment(unitData.to);
				}
				
				const unitRoles = [];
				const unitAirfields = [];
				const unitPlanes = [];
				
				// Collect unit data
				while (unitData) {
					
					// Unit roles
					if (unitData.role) {
						
						let roles = unitData.role;
						
						if (!Array.isArray(roles)) {
							roles = [[roles]];
						}
						
						unitRoles.push(roles);
					}
					
					// Unit airfields
					if (unitData.airfields) {
						unitAirfields.push(unitData.airfields);
					}
					
					// Unit planes
					if (unitData.planes) {
						unitPlanes.push(unitData.planes);
					}
					
					// Unit alias
					if (!unitSuffix && unitData.suffix) {
						unitSuffix = unitData.suffix;
					}
					
					// Unit alias
					if (!unitAlias && unitData.alias) {
						unitAlias = unitData.alias;
					}
					
					unitData = battle.units[unitData.parent];
				}
				
				if (!unitRoles.length || !unitAirfields.length || !unitPlanes.length) {
					continue;
				}
				
				// Index unit for each day of the battle
				const date = moment(unitFrom);
				for (; date.isSameOrBefore(unitTo, "day"); date.add(1, "day")) {
					
					const dateKey = date.format("YYYY-MM-DD");
					
					// Utility function used to match to/from date ranges
					const matchDateRange = data.matchDateRange.bind(undefined, {
						from: battleFrom,
						to: battleTo,
						date
					});
					
					const tasks = new Set();
					
					// Find matching tasks
					for (const dataRoles of unitRoles) {
						
						if (tasks.size) {
							break;
						}
						
						for (const dataRole of dataRoles) {
							
							if (matchDateRange(dataRole[1], dataRole[2])) {
								
								const roleData = battle.roles[unitCountry][dataRole[0]];
								
								for (const taskID in roleData) {
									tasks.add(taskID);
								}
								
								break;
							}
						}
					}
					
					const planes = new Set();
					
					// Find matching planes
					for (const dataPlanes of unitPlanes) {
						
						if (planes.size) {
							break;
						}
						
						for (const dataPlane of dataPlanes) {

							if (matchDateRange(dataPlane[2], dataPlane[3])) {
								
								let planeID = dataPlane[0];
								let planeData = data.planes[planeID];
								
								// Resolve plane alias
								while (typeof planeData === "string") {
									
									planeID = planeData;
									planeData = data.planes[planeID];
								}
								
								if (planeID && planeData) {
									
									let validPlaneTypes = [planeID];
									
									// Add all plane types belonging to a group
									if (planeGroupIndex[planeID]) {
										validPlaneTypes = planeGroupIndex[planeID];
									}
									
									validPlaneTypes.forEach((planeID) => {
										planes.add(planeID);
									});
								}
							}
						}
					}
					
					if (!planes.size) {
						continue;
					}
					
					const airfields = new Map();
					const rebase = {
						to: []
					};
					
					// Find matching airfields
					for (const dataAirfields of unitAirfields) {
						
						if (airfields.size) {
							break;
						}
						
						for (const dataAirfield of dataAirfields) {
							
							const airfieldID = dataAirfield[0];
							
							// Invalid airfield ID
							if (airfieldsIndex[airfieldID] === undefined) {
								continue;
							}
							
							const isGroundStart = (airfieldsIndex[airfieldID] > 0);
							const isOffmap = (airfieldsIndex[airfieldID] < 0);

							if (matchDateRange(dataAirfield[1], dataAirfield[2])) {

								let availability = dataAirfield[3];
								
								if (typeof availability !== "number") {
									availability = 1;
								}
								
								if (data.tasks.rebase) {
								
									// Auto-assign rebase task
									if (airfields.size) {
										
										const toPosition = battle.airfields[airfieldID].position;
										const toVector = Vector.create([toPosition[0], toPosition[2]]);
										const rebaseDistance = rebase.fromVector.distanceFrom(toVector);
										
										// Enforce required minimum distance between rebase airfields
										if (rebaseDistance >= data.tasks.rebase.distanceMin) {
											rebase.to.push(airfieldID);
										}
									}
									else {
										
										const fromPosition = battle.airfields[airfieldID].position;
										
										rebase.from = airfieldID;
										rebase.fromVector = Vector.create([fromPosition[0], fromPosition[2]]);
									}
								}
								
								// TODO: Also include offmap airfields as valid air start!
								if (!isOffmap && availability > 0) {
									airfields.set(airfieldID, isGroundStart);
								}
							}
						}
					}
					
					if (!airfields.size) {
						continue;
					}
					
					if (rebase.to.length) {
						tasks.add("rebase");
					}
					else {
						delete rebase.from;
					}
					
					if (!tasks.size) {
						continue;
					}
					
					planes.forEach((planeID) => {
						
						const validTasks = [];
						
						// Filter out tasks not valid for this plane type
						for (const taskID of tasks) {
							
							if (planeTaskIndex[planeID].length &&
									planeTaskIndex[planeID].indexOf(taskID) >= 0) {
							
								validTasks.push(taskID);
							}
						}
						
						if (!validTasks.length) {
							return;
						}
						
						let season = seasonIndex[dateKey];
						
						if (season === undefined) {
							
							let foundSeason = false;
							
							// Find matching map season
							for (season in battle.map.season) {
								
								const seasonData = battle.map.season[season];
								const seasonFrom = moment(seasonData.from);
								const seasonTo = moment(seasonData.to);
								
								if (!date.isBefore(seasonFrom, "day") &&
										!date.isAfter(seasonTo, "day")) {
									
									foundSeason = season;
									break;
								}
							}
							
							seasonIndex[dateKey] = season = foundSeason;
						}
						
						// Register new season index
						if (season) {
	
							let jsonSeason = json.seasons[season];
							
							if (!jsonSeason) {
								jsonSeason = json.seasons[season] = [];
							}
							
							if (jsonSeason.indexOf(dateKey) === -1) {
								jsonSeason.push(dateKey);
							}
						}
						
						// Register new country
						if (!json.countries[unitCountry]) {
							json.countries[unitCountry] = data.countries[unitCountry].name;
						}
						
						// Register new unit
						if (!json.units[unitID]) {
							
							const unitIndexData = {
								name: unitName,
								country: unitCountry
							};
							
							if (unitSuffix) {
								unitIndexData.suffix = unitSuffix;
							}
							
							if (unitAlias) {
								unitIndexData.alias = unitAlias;
							}
							
							json.units[unitID] = unitIndexData;
						}
						
						// Register new plane
						if (!json.planes[planeID]) {
							json.planes[planeID] = data.planes[planeID].name;
						}
						
						validTasks.forEach((taskID) => {
							
							// Register new task
							if (!json.tasks[taskID]) {
								json.tasks[taskID] = data.tasks[taskID].name;
							}
						
							airfields.forEach((isGroundStart, airfieldID) => {
								
								if (taskID === "rebase" && airfieldID !== rebase.from) {
									return;
								}
								
								const recordKey = [
									unitCountry,
									unitID,
									planeID,
									airfieldID,
									taskID
								].join("~");
								
								let recordID = json.records[recordKey];
								
								// Register new record ID
								if (!recordID) {
									
									recordID = ++lastRecordKey;
									recordID = isGroundStart ? recordID : -recordID;
									
									json.records[recordKey] = recordID;
								}
								
								// Register new airfield
								if (!json.airfields[airfieldID]) {
									json.airfields[airfieldID] = battle.airfields[airfieldID].name;
								}
								
								// Register new date index
								const dateIndex = datesIndex[dateKey] || Object.create(null);
								
								if (!dateIndex[recordID]) {
									dateIndex[recordID] = true;
								}
								
								datesIndex[dateKey] = dateIndex;
							});
						});
					});
				}
				
				totalUnits++;
			}
			
			// Sort season data
			for (const season in json.seasons) {
				json.seasons[season].sort();
			}
			
			// Sort and build dates index
			Object.keys(datesIndex).sort().forEach((date) => {
				
				json.dates[date] = [];
				
				for (const recordID in datesIndex[date]) {
					json.dates[date].push(+recordID);
				}
			});
			
			// Write battle JSON index file
			grunt.file.write(
				"data/battles/" + battleID + "/index.json",
				JSON.stringify(json, null, "\t")
			);
			
			totalBattles++;
		}

		let message = "";
		
		message += numeral(totalUnits).format("0,0") + " ";
		message += grunt.util.pluralize(totalUnits, "unit/units");
		message += " indexed from " + numeral(totalBattles).format("0,0") + " ";
		message += grunt.util.pluralize(totalBattles, "battle/battles") + ".";

		grunt.log.ok(message);
	});
};