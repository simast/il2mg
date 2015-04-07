/** @copyright Simas Toleikis, 2015 */
"use strict";

// Generate mission name
module.exports = function makeName() {

	var options = this.items.Options;

	options.setName(this.getLC(this.battle.name));
};