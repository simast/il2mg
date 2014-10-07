/** @copyright Simas Toleikis, 2014 */
"use strict";

// Generate mission name
module.exports = function(mission) {

	var options = mission.blocks.Options;

	options.setName(mission.getLC(mission.battle.name));
};