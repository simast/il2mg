/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission name
module.exports = function(mission, data) {

	var options = mission.blocks.Options;

	options.setName(mission.getLC(mission.battle.name));
};