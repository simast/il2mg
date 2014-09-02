/** @copyright Simas Toleikis, 2014 */
"use strict";

var Airplane = require("../entity/Airplane");

// Generate mission flights
module.exports = function(mission) {

	var playerAirplane = new Airplane("Bf109G2");

	playerAirplane.setPosition(185780.563, 197.342, 165961.297);
	playerAirplane.setOrientation(0, 54.63, 0);

	mission.entities.playerAirplane = playerAirplane;
};