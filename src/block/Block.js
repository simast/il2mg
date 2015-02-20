/** @copyright Simas Toleikis, 2015 */
"use strict";

// Static block
function Block() {

}

Block.prototype = new (require("../block"))();
Block.prototype.id = 1;

module.exports = Block;