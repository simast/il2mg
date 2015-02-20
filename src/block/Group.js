/** @copyright Simas Toleikis, 2015 */
"use strict";

var Block = require("../block");

// Group block
function Group() {

}

Group.prototype = new Block();
Group.prototype.id = 123;

module.exports = Group;