/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Flag block
function Flag() {

}

Flag.prototype = Object.create(BlockParent.prototype);

module.exports = Flag;