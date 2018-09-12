import data from "../data"

// Generate available mission formations
export default function makeFormations() {

	// Formations index table
	const formations = Object.create(null)

	// Process all active countries in the battle
	for (const countryID of this.battle.countries) {

		formations[countryID] = Object.create(null)

		// Process all formations and build index list
		for (const formationID in data.countries[countryID].formations) {

			let formationData = data.countries[countryID].formations[formationID]

			// Ignore dummy formation definitions (and groups used to catalog formations)
			if (!formationData || !formationData.elements) {
				continue
			}

			const formationFrom = formationData.from
			const formationTo = formationData.to

			// Filter out formations with from/to dates
			if ((formationFrom && this.date.isBefore(formationFrom, "day")) ||
					(formationTo && this.date.isAfter(formationTo, "day"))) {

				continue
			}

			delete formationData.from
			delete formationData.to

			const formation = Object.create(null)

			formation.id = formationID

			// Build formation data and register formation parent/group hierarchy
			while (formationData) {

				// Collect/copy formation data from current hierarchy
				for (const prop in formationData) {

					if (formation[prop] === undefined) {
						formation[prop] = formationData[prop]
					}
				}

				const formationParentID = formationData.parent

				if (!formationParentID) {
					break
				}
				// Set formation group as a top-most parent
				else {
					formation.group = formationParentID
				}

				formationData = data.countries[countryID].formations[formationParentID]

				// Register formation in the parent group hierarchy
				const formationGroup = formations[countryID][formationParentID] || []

				// Register a new child formation in the formation group
				if (Array.isArray(formationGroup)) {

					formationGroup.push(formationID)

					if (formationData.parent !== undefined) {
						formationGroup.parent = formationData.parent
					}

					formations[countryID][formationParentID] = formationGroup
				}
			}

			// Register formation to ID index
			formations[countryID][formationID] = formation
		}

		// Resolve required plane counts for formation elements
		for (const formationID in formations[countryID]) {

			const formationElements = formations[countryID][formationID].elements

			// Ignore formation groups
			if (!formationElements) {
				continue
			}

			const planes = formationElements.planes = []

			;(function buildPlanes(elements) {

				for (const element of elements) {

					// Add required plane count for simple element
					if (typeof element === "number") {
						planes.push(element)
					}
					// Resolve required plane count for sub-formation elements
					else {

						const subFormation = formations[countryID][element]

						if (subFormation.elements) {
							buildPlanes(subFormation.elements)
						}
					}
				}
			})(formationElements)
		}
	}

	// Static formations index object
	this.formations = Object.freeze(formations)
}
