/** @copyright Simas Toleikis, 2015 */
"use strict";

const Item = require("../item");

// Group item
function Group() {

}

Group.prototype = Object.create(Item.prototype);
Group.prototype.typeID = 6;
Group.prototype.hasIndex = false;

module.exports = Group;