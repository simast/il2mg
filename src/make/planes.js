/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission planes
module.exports = function makePlanes() {

	var data = this.data;
	var battle = this.battle;

	// Skin data array index to use when building valid/weighted plane skin list
	var skinDataIndex = [
		"spring",
		"summer",
		"autumn",
		"winter",
		"desert"
	].indexOf(this.map.season);

	// Plane index tables
	var planesByID = Object.create(null);
	var planesByType = Object.create(null);

	// Process all planes and build index lists
	for (var planeID in data.planes) {

		var planeData = data.planes[planeID];

		// Ignore dummy plane definitions (and groups used to catalog planes)
		if (!planeData || !planeData.name || !planeData.model || !planeData.script) {
			continue;
		}

		var plane = Object.create(null);
		
		plane.id = planeID;

		// Build plane data and register plane parent/group hierarchy
		while (planeData) {

			// Collect/copy plane data from current hierarchy
			for (var prop in planeData) {

				// Collect plane skin data
				if (prop === "skins") {

					var skins = getSkins(planeData);

					if (skins) {
						plane.skins = skins;
					}
				}
				// Collect other plane data
				else if (plane[prop] === undefined) {
					plane[prop] = planeData[prop];
				}
			}

			var planeParentID = planeData.parent;

			if (!planeParentID) {
				break;
			}
			// NOTE: Set plane group as a top-most parent
			else {
				plane.group = planeParentID;
			}

			planeData = data.planes[planeParentID];

			// Register plane in the parent group hierarchy
			var planeGroup = planesByID[planeParentID] || [];

			// Register a new child plane in the plane group
			if (Array.isArray(planeGroup)) {

				planeGroup.push(planeID);

				if (planeData.name !== undefined) {
					planeGroup.name = planeData.name;
				}

				if (planeData.parent !== undefined) {
					planeGroup.parent = planeData.parent;
				}

				planesByID[planeParentID] = planeGroup;
			}
		}

		// Register plane to ID index
		planesByID[planeID] = plane;

		// Register plane to type index
		if (Array.isArray(plane.type)) {

			plane.type.forEach(function(type) {

				planesByType[type] = planesByType[type] || [];
				planesByType[type].push(plane);
			});
		}
	}

	// Get plane skins data
	function getSkins(planeData) {

		if (!planeData.skins) {
			return;
		}

		// Plane skin data to weighted skin data object index
		if (!getSkins.index) {
			getSkins.index = new Map();
		}
		// Check skin data index
		else if (getSkins.index.has(planeData)) {
			return getSkins.index.get(planeData);
		}

		var skins = null;

		for (var countryID in planeData.skins) {

			// Ignore skins from countries that are not part of this battle
			if (battle.countries.indexOf(Number(countryID)) === -1) {
				continue;
			}

			var countrySkins = [];

			// Build a weighted plane skin list matching current battle map season
			for (var skinID in planeData.skins[countryID]) {

				var skinData = planeData.skins[countryID][skinID][skinDataIndex];
				
				if (skinData === undefined) {
					continue;
				}
				
				var skinWeight = Math.abs(skinData);

				// Add weighted number of skin IDs
				for (var n = 0; n < skinWeight; n++) {
					
					countrySkins.push(skinID);
					
					// Build player-only skin list
					if (skinData < 0) {
						
						countrySkins.player = countrySkins.player || [];
						countrySkins.player.push(skinID);
					}
				}

				if (countrySkins.length) {
					
					if (!skins) {
						skins = Object.create(null);
					}
					
					skins[countryID] = countrySkins;
				}
			}
		}
		
		getSkins.index.set(planeData, skins);

		return skins;
	}

	// Static plane data index objects
	this.planesByID = Object.freeze(planesByID);
	this.planesByType = Object.freeze(planesByType);
};