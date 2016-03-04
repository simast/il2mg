/** @copyright Simas Toleikis, 2016 */
"use strict";

const numeral = require("numeral");
const moment = require("moment");
const data = require("../../src/data");

module.exports = function(grunt) {

	// Grunt task used to build battle index database
	grunt.registerTask("build:index", "Build index database JSON files.", () => {

		let totalBattles = 0;
		let totalUnits = 0;
		
		// Build a list of planes indexed by parent group
		const planeGroupIndex = Object.create(null);
		
		for (const planeID in data.planes) {
			
			let planeData = data.planes[planeID];
			
			// Ignore dummy plane definitions (and groups used to catalog planes)
			if (!planeData || typeof planeData !== "object" || !planeData.name ||
				!planeData.model || !planeData.script) {
				
				continue;
			}
			
			// Register plane parent/group index hierarchy
			while (planeData) {
				
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
			let lastRecordKey = 0;
			
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
				let unitAlias;
				
				if (unitData.from) {
					unitFrom = moment(unitData.from);
				}
				
				if (unitData.to) {
					unitTo = moment(unitData.to);
				}
				
				const unitAirfields = [];
				const unitPlanes = [];
				
				// Collect unit data
				while (unitData) {
					
					if (unitData.airfields) {
						unitAirfields.push(unitData.airfields);
					}
					
					if (unitData.planes) {
						unitPlanes.push(unitData.planes);
					}
					
					if (!unitAlias && unitData.alias) {
						unitAlias = unitData.alias;
					}
					
					unitData = battle.units[unitData.parent];
				}
				
				if (!unitAirfields.length || !unitPlanes.length) {
					continue;
				}
				
				// Index unit for each day of the battle
				const date = moment(unitFrom);
				for (; date.isSameOrBefore(unitTo, "day"); date.add(1, "day")) {
					
					// Utility function used to match to/from date ranges
					const matchDateRange = data.matchDateRange.bind(undefined, {
						from: battleFrom,
						to: battleTo,
						date
					});
					
					const dateKey = date.format("YYYY-MM-DD");
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
					
					// Find matching airfields
					for (const dataAirfields of unitAirfields) {
						
						if (airfields.size) {
							break;
						}
						
						for (const dataAirfield of dataAirfields) {
							
							const airfieldID = dataAirfield[0];
							
							if (!battle.airfields[airfieldID]) {
								continue;
							}

							if (matchDateRange(dataAirfield[1], dataAirfield[2])) {

								let availability = dataAirfield[3];
								
								if (typeof availability !== "number") {
									availability = 1;
								}
								
								if (availability > 0) {
									airfields.set(airfieldID, true);
								}
							}
						}
					}
					
					if (!airfields.size) {
						continue;
					}
					
					// Register new country
					if (!json.countries[unitCountry]) {
						json.countries[unitCountry] = data.countries[unitCountry].name;
					}
					
					// Register new unit
					if (!json.units[unitID]) {
						
						let name = unitName;
						
						if (unitAlias) {
							name += " “" + unitAlias + "”";
						}
						
						json.units[unitID] = name;
					}
					
					planes.forEach((planeID) => {
						
						// Register new plane
						if (!json.planes[planeID]) {
							json.planes[planeID] = data.planes[planeID].name;
						}
						
						airfields.forEach((isGroundStart, airfieldID) => {
							
							const recordKey = [
								unitCountry,
								unitID,
								planeID,
								airfieldID
							].join("~");
							
							let recordID = json.records[recordKey];
							
							// Register new record ID
							if (!recordID) {
								recordID = json.records[recordKey] = ++lastRecordKey;
							}
							
							// Register new airfield
							if (!json.airfields[airfieldID]) {
								json.airfields[airfieldID] = battle.airfields[airfieldID].name;
							}
							
							// Register new date index
							/*
							const dateIndex = json.dates[dateKey] || [];
							
							if (dateIndex.indexOf(recordID) === -1) {
								dateIndex.push(recordID);
							}
							
							json.dates[dateKey] = dateIndex;
							*/
						});
					});
				}
				
				totalUnits++;
			}
			
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