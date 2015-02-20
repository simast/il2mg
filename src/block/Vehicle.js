/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Vehicle
function Vehicle() {

}

Vehicle.prototype = new Block();
Vehicle.prototype.id = 123;

module.exports = Vehicle;