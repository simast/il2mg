import { Coalition } from '../data/enums';

/**
 * Get opposing (enemy) coalition.
 *
 * @param friendlyCoalition Friendly coalition ID.
 * @returns Enemy coalition ID.
 */
export function getEnemyCoalition(friendlyCoalition: Coalition): Coalition {
	if (friendlyCoalition === Coalition.Allies) {
		return Coalition.Axis;
	}

	if (friendlyCoalition === Coalition.Axis) {
		return Coalition.Allies;
	}

	return Coalition.Neutral; // Unknown/neutral
}
