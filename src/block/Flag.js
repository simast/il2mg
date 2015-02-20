/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Flag block
function Flag() {

}

Flag.prototype = new Block();
Flag.prototype.id = 123;

module.exports = Flag;