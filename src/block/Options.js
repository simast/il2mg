/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Options block
function Options() {

}

Options.prototype = new Block();
Options.prototype.id = 25;

module.exports = Options;