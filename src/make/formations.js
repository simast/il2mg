/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate available mission formations
module.exports = function makeFormations() {

	// Formations index table
	var formations = Object.create(null);
	
	// Process all active countries in the battle
	for (var countryID of this.battle.countries) {
		
		formations[countryID] = Object.create(null);
		
		// Process all formations and build index list
		for (var formationID in DATA.countries[countryID].formations) {
	
			var formationData = DATA.countries[countryID].formations[formationID];
	
			// Ignore dummy formation definitions (and groups used to catalog formations)
			if (!formationData || !formationData.planes) {
				continue;
			}
			
			var formationFrom = formationData.from;
			var formationTo = formationData.to;
			
			// Filter out formations with from/to dates
			if ((formationFrom && this.date.isBefore(formationFrom)) ||
					(formationTo && this.date.isAfter(formationTo) && !this.date.isSame(formationTo, "day"))) {
	
				continue;
			}
			
			delete formationData.from;
			delete formationData.to;
	
			var formation = Object.create(null);
			
			formation.id = formationID;
	
			// Build formation data and register formation parent/group hierarchy
			while (formationData) {
	
				// Collect/copy formation data from current hierarchy
				for (var prop in formationData) {
					
					if (formation[prop] === undefined) {
						formation[prop] = formationData[prop];
					}
				}
	
				var formationParentID = formationData.parent;
	
				if (!formationParentID) {
					break;
				}
				// Set formation group as a top-most parent
				else {
					formation.group = formationParentID;
				}
	
				formationData = DATA.countries[countryID].formations[formationParentID];
	
				// Register formation in the parent group hierarchy
				var formationGroup = formations[countryID][formationParentID] || [];
	
				// Register a new child formation in the formation group
				if (Array.isArray(formationGroup)) {
	
					formationGroup.push(formationID);
	
					if (formationData.parent !== undefined) {
						formationGroup.parent = formationData.parent;
					}
	
					formations[countryID][formationParentID] = formationGroup;
				}
			}
	
			// Register formation to ID index
			formations[countryID][formationID] = formation;
		}
	}

	// Static formations index object
	this.formations = Object.freeze(formations);
};