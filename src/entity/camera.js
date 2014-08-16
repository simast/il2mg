/** @copyright Simas Toleikis, 2014 */
"use strict";

var Entity = require("../Entity");

/**
 * Create MCU_TR_CameraOperator entity.
 */
function Camera() {

}

Camera.prototype = new Entity("MCU_TR_CameraOperator");

module.exports = Camera;