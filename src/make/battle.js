/** @copyright Simas Toleikis, 2015 */
"use strict";

const data = require("../data");
const log = require("../log");
const Item = require("../item");

// Generate mission battle info
module.exports = function makeBattle() {

	const params = this.params;
	let battleID = params.battle;

	// Select random battle
	if (!battleID) {
		battleID = this.rand.pick(Object.keys(data.battles));
	}

	this.battleID = battleID;
	this.battlePath = "../../data/battles/" + battleID + "/";
	
	const battle = this.battle = data.battles[battleID];
	const coalitions = this.coalitions = [];

	// Create main mission Options item
	const options = this.createItem("Options");

	options.LCAuthor = this.getLC(data.name + " " + data.version);
	options.MissionType = 0; // Single-player mission
	options.AqmId = 0; // TODO: ?

	// Set country:coalition list
	options.Countries = (() => {

		const countries = [];

		// Unknown (neutral) country and coalition
		coalitions.push(Item.DEFAULT_COALITION);
		countries.push([Item.DEFAULT_COUNTRY, Item.DEFAULT_COALITION]);

		battle.countries.forEach((countryID) => {
			
			const coalitionID = data.countries[countryID].coalition;
			
			if (coalitions.indexOf(coalitionID) === -1) {
				coalitions.push(coalitionID);
			}
			
			countries.push([countryID, coalitionID]);
		});

		return countries;
	})();
	
	// Set PlayerConfig property to selected player plane item
	this.make.push(() => {
		options.PlayerConfig = this.player.item.Script;
	});

	// Save "Options" mission item reference
	this.items.Options = options;

	// Log mission battle
	log.I("Battle:", battle.name);
};