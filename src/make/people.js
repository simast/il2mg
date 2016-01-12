/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission people
module.exports = function makePeople() {

	const rand = this.rand;

	// Get a random weighted name
	function getName(names) {

		const nameParts = Object.create(null);

		// Make all name parts
		for (const namePart in names) {

			const parts = [];

			// Make each sub-part of name part
			names[namePart].forEach((nameList) => {

				// Build range/interval name list index
				if (!nameList.ranges) {

					nameList.ranges = [];

					Object.keys(nameList).forEach((value) => {

						value = parseInt(value, 10);

						if (!isNaN(value)) {
							nameList.ranges.push(value);
						}
					});

					nameList.ranges.sort((a, b) => {
						return b - a;
					});
				}

				let name;
				let weight;
				let weightCurrent = 0;
				const weightTarget = rand.integer(1, nameList.total);

				for (weight of nameList.ranges) {

					weightCurrent += weight;

					if (weightTarget <= weightCurrent) {

						// Name part matches weight
						name = rand.pick(nameList[weight]);
						break;
					}
				}

				// Use one of the least popular name parts
				if (!name) {
					name = rand.pick(nameList[weight]);
				}

				if (name.length) {
					parts.push(name);
				}
			});

			nameParts[namePart] = parts;
		}

		return nameParts;
	}

	// Get a rank
	function getRank(rankID, countryID) {

		const ranks = DATA.countries[countryID].ranks;

		// Generate a random weighted rank based on type and/or range bounds
		if (typeof rankID === "object") {

			const ranksWeighted = ranks.weighted[rankID.type];

			// Random weighted rank for a given type
			if (rankID.min === undefined || rankID.max === undefined) {
				rankID = rand.pick(ranksWeighted);
			}
			// Use weighted rank range bounds
			else {
				rankID = ranksWeighted[rand.integer(rankID.min, rankID.max)];
			}
		}

		const rankData = ranks[rankID];
		const rank = Object.create(null);

		// Rank ID
		rank.id = rankID;

		// Full rank name
		rank.name = rankData.name;

		// Short rank abbreviation
		if (rankData.abbr) {
			rank.abbr = rankData.abbr;
		}

		return rank;
	}

	// Export functions used for making random names and ranks
	makePeople.getName = getName;
	makePeople.getRank = getRank;
};