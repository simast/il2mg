/** @copyright Simas Toleikis, 2014 */
"use strict";

// Generate mission name
module.exports = function(mission) {

	var options = mission.entities.Options;

	options.setName(mission.lang(mission.battle.name));
};