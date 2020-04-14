import path from 'path';

import { Mission } from '.';
import { Immutable } from '../types';
import { log } from '../log';
import { Options } from '../items';
import { DEFAULT_COALITION, DEFAULT_COUNTRY } from '../items/constants';
import { data } from '../data';
import { Country, Coalition } from '../data/enums';
import { APPLICATION_NAME, APPLICATION_VERSION } from '../constants';

// Create main mission Options item
const createOptionsItem = (
	mission: Mission,
	countries: Immutable<Country[]>,
): Options => {
	const options = mission.createItem('Options');
	const author = `${APPLICATION_NAME} r${APPLICATION_VERSION}`;

	options.LCAuthor = mission.getLC(author);
	options.MissionType = 0; // Single-player mission

	const coalitionByCountry = new Map<Country, Coalition>();

	// Unknown (neutral) country and coalition
	coalitionByCountry.set(DEFAULT_COUNTRY, DEFAULT_COALITION);

	countries.forEach(countryId => {
		// Support for "alias" (hidden) countries
		countryId = data.countries[countryId].alias ?? countryId;
		coalitionByCountry.set(countryId, data.countries[countryId].coalition);
	});

	// Set country:coalition list
	options.Countries = Array.from(coalitionByCountry);

	return options;
};

// Generate mission battle info
export default function makeBattle(this: Mission) {
	const { params, rand } = this;
	let battleId = params.battle;

	// Select random battle
	if (!battleId) {
		battleId = rand.pick(Object.keys(data.battles));
	}

	const battle = data.battles[battleId]!;
	const battlePath = path.join('battles', battleId);
	const index = data.load<any>(battlePath);
	const options = createOptionsItem(this, battle.countries);

	const coalitions: Coalition[] = Array.from(
		new Set(options.Countries.map(([, coalitionId]) => coalitionId)),
	);

	// Set PlayerConfig property to selected player plane item
	this.make.push(() => {
		options.PlayerConfig = this.player.item.Script;
	});

	// Log mission battle
	log.I('Battle:', battle.name, { days: Object.keys(index.dates).length });

	return { battle, battlePath, coalitions, index, options };
}
