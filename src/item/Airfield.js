/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Airfield item
function Airfield() {

}

Airfield.prototype = Object.create(Item.prototype);

module.exports = Airfield;