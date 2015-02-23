/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission name
module.exports = function(mission, data) {

	var options = mission.items.Options;

	options.setName(mission.getLC(mission.battle.name));
};