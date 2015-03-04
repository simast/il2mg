/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission planes
module.exports = function(mission, data) {

	var battle = mission.battle;

	// Plane index tables
	var planesByID = Object.create(null);
	var planesByType = Object.create(null);

	// Process all planes and build index lists
	for (var planeID in data.planes) {

		var planeData = data.planes[planeID];

		// Ignore dummy plane definitions (and groups used to catalog planes)
		if (!planeData || !planeData.name) {
			continue;
		}

		var plane = Object.create(null);
		var planeGroupID;

		planeID = planeID.toLowerCase();

		// Build plane data and register plane parent/group hierarchy
		while (planeData) {

			// Collect/copy plane data from current hierarchy
			for (var prop in planeData) {

				if (plane[prop] === undefined) {

					// NOTE: All plane IDs must be lowercase in index tables
					if (prop === "parent") {
						plane[prop] = planeData[prop].toLowerCase();
					}
					else {
						plane[prop] = planeData[prop];
					}
				}
			}

			var planeParentID = planeData.parent;

			if (!planeParentID) {
				break;
			}

			planeData = data.planes[planeParentID];
			planeParentID = planeParentID.toLowerCase();

			// Register plane in the parent group hierarchy
			if (plane.name) {

				var planeGroup = planesByID[planeParentID] || [];

				// Register a new child plane in the plane group
				if (Array.isArray(planeGroup)) {

					planeGroup.push(planeID);
					planesByID[planeParentID] = planeGroup;
				}
			}

			planeGroupID = planeParentID;
		}

		// Remove invalid plane definition
		if (!plane.model || !plane.script) {

			// TODO: Clean up parent plane groups

			continue;
		}

		// NOTE: Plane group is a top-most parent
		if (planeGroupID) {
			plane.group = planeGroupID;
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