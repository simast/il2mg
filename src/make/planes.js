/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission planes
module.exports = function makePlanes() {

	var mission = this;
	var data = mission.data;
	var battle = mission.battle;

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

				if (plane[prop] === undefined) {
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

	// Static plane data index objects
	mission.planesByID = Object.freeze(planesByID);
	mission.planesByType = Object.freeze(planesByType);
};