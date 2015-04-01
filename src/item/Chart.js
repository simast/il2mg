/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../item");

// Chart item
function Chart() {

}

Chart.prototype = Object.create(Item.prototype);
Chart.prototype.hasIndex = false;

module.exports = Chart;