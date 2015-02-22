/** @copyright Simas Toleikis, 2015 */
"use strict";

var BlockParent = require("../block");

// Chart block
function Chart() {

}

Chart.prototype = Object.create(BlockParent.prototype);

module.exports = Chart;