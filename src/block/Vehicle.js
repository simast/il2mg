/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Vehicle
function Vehicle() {

}

Vehicle.prototype = Object.create(BlockParent.prototype);

module.exports = Vehicle;