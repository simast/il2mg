/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Chart block
function Chart() {

}

Chart.prototype = new Block();
Chart.prototype.id = 123;

module.exports = Chart;