/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission planes
module.exports = function makePlanes() {

	const battle = this.battle;

	// Skin data array index to use when building valid/weighted plane skin list
	const skinDataIndex = [
		"spring",
		"summer",
		"autumn",
		"winter",
		"desert"
	].indexOf(this.map.season);

	// Plane index tables
	const planes = Object.create(null);
	const planesByType = Object.create(null);

	// Map of plane alias references
	const planeAlias = Object.create(null);

	// Process all planes and build index lists
	for (const planeID in DATA.planes) {

		let planeData = DATA.planes[planeID];

		// Alias reference to another plane type
		if (typeof planeData === "string") {

			planeAlias[planeID] = planeData;
			continue;
		}

		// Ignore dummy plane definitions (and groups used to catalog planes)
		if (!planeData || !planeData.name || !planeData.model || !planeData.script) {
			continue;
		}

		const plane = Object.create(null);

		plane.id = planeID;

		// Build plane data and register plane parent/group hierarchy
		while (planeData) {

			// Collect/copy plane data from current hierarchy
			for (const prop in planeData) {

				// Collect plane skin data
				if (prop === "skins") {

					const skins = getSkins(planeData);

					if (skins) {
						plane.skins = skins;
					}
				}
				// Collect other plane data
				else if (plane[prop] === undefined) {
					plane[prop] = planeData[prop];
				}
			}

			const planeParentID = planeData.parent;

			if (!planeParentID) {
				break;
			}
			// NOTE: Set plane group as a top-most parent
			else {
				plane.group = planeParentID;
			}

			planeData = DATA.planes[planeParentID];

			// Register plane in the parent group hierarchy
			const planeGroup = planes[planeParentID] || [];

			// Register a new child plane in the plane group
			if (Array.isArray(planeGroup)) {

				planeGroup.push(planeID);

				if (planeData.name !== undefined) {
					planeGroup.name = planeData.name;
				}

				if (planeData.parent !== undefined) {
					planeGroup.parent = planeData.parent;
				}

				planes[planeParentID] = planeGroup;
			}
		}

		// Register plane to ID index
		planes[planeID] = plane;

		// Register plane to type index
		if (Array.isArray(plane.type)) {

			plane.type.forEach((type) => {

				planesByType[type] = planesByType[type] || [];
				planesByType[type].push(plane);
			});
		}
	}

	// Process all plane alias references
	for (const planeID in planeAlias) {

		const aliasPlaneID = planeAlias[planeID];

		if (planes[aliasPlaneID]) {
			planes[planeID] = planes[aliasPlaneID];
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

		let skins = null;

		for (const countryID in planeData.skins) {

			// Ignore skins from countries that are not part of this battle
			if (battle.countries.indexOf(Number(countryID)) === -1) {
				continue;
			}

			const countrySkins = [];

			// Build a weighted plane skin list matching current battle map season
			for (const skinID in planeData.skins[countryID]) {

				const skinData = planeData.skins[countryID][skinID][skinDataIndex];

				if (skinData === undefined) {
					continue;
				}

				const skinWeight = Math.abs(skinData);

				// Add weighted number of skin IDs
				for (let n = 0; n < skinWeight; n++) {

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
	this.planes = Object.freeze(planes);
	this.planesByType = Object.freeze(planesByType);
};