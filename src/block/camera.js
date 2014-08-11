/** @copyright Simas Toleikis, 2014 */
"use strict";

var Block = require("../block");

/**
 * Create MCU_TR_CameraOperator block.
 */
function Camera() {

}

Camera.prototype = new Block("MCU_TR_CameraOperator");

module.exports = Camera;