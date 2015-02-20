/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Bridge block
function Bridge() {

}

Bridge.prototype = new Block();
Bridge.prototype.id = 123;

module.exports = Bridge;