/** @copyright Simas Toleikis, 2015 */
"use strict"

const Item = require("../item")

// Group item
module.exports = class Group extends Item {

	get hasIndex() { return false }
}