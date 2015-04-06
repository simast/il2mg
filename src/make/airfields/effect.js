/** @copyright Simas Toleikis, 2015 */
"use strict";

var Item = require("../../item");
var itemFlags = require("./").itemFlags;

// Make effect airfield item
module.exports = function(mission, item) {

	if (!this.country) {
		return;
	}

	var effectType = item[4];

	// Enforce airfield limits
	if (this.limits.effects[effectType] <= 0) {
		return;
	}

	var effects = mission.data.effects;
	var effectScript;

	// House smoke
	if (effectType === itemFlags.EFFECT_SMOKE) {
		effectScript = effects.house_smoke.script;
	}
	// Campfire
	else if (effectType === itemFlags.EFFECT_CAMP) {
		effectScript = effects.landfire.script;
	}
	// Siren
	else if (effectType === itemFlags.EFFECT_SIREN) {
		effectScript = effects.siren.script;
	}

	// TODO: Add support for EFFECT:LAND

	if (!effectScript) {
		return;
	}

	var items = [];
	var rand = mission.rand;
	var effect = mission.createItem("Effect", false);

	effect.setPosition(item[1], item[2], item[3]);
	effect.setOrientation(rand.real(0, 360));
	effect.Script = effectScript;

	effect.createEntity();

	// TODO: Add support for EFFECT:SIREN
	if (effectType !== itemFlags.EFFECT_SIREN) {

		// Create a shared effect start command (when airfield is loaded)
		if (!this.onLoadEffect) {

			this.onLoadEffect = mission.createItem("MCU_CMD_Effect", false);
			this.onLoadEffect.setPositionNear(this.onLoad);
			this.onLoadEffect.ActionType = Item.MCU_CMD_Effect.ACTION.START;

			this.onLoad.addTarget(this.onLoadEffect);

			// TODO: Create onUnloadEffect command

			items.push(this.onLoadEffect);
		}

		this.onLoadEffect.addObject(effect);
	}

	items.push(effect);

	// Update airfield limits
	if (this.limits.effects[effectType]) {
		this.limits.effects[effectType]--;
	}

	return items;
};