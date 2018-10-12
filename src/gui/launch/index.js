import fs from 'fs'
import path from 'path'

// Realism presets
export const RealismPreset = Object.freeze({
	Custom: 0,
	Normal: 1,
	Expert: 2
})

// Realism options
export const RealismOption = Object.freeze({
	ObjectMarkers: 'objectIcons',
	AimingAssist: 'aimingHelp',
	BombingAssist: 'courseWeaponsAimingHelp',
	Padlock: 'padLock',
	NavigationMarkers: 'navigationIcons',
	InstrumentPanel: 'simpleDevices',
	AllowSpectators: 'allowSpectator',
	SimplifiedPhysics: 'noMoment',
	NoWind: 'noWind',
	NoMisfires: 'noMisfire',
	Unbreakable: 'noBreak',
	Invulnerability: 'invulnerability',
	UnlimitedFuel: 'unlimitFuel',
	UnlimitedAmmo: 'unlimitAmmo',
	NoEngineStall: 'engineNoStop',
	WarmedUpEngine: 'hotEngine',
	SimplifiedControls: 'easyFlight',
	RudderAssist: 'autoCoordination',
	CruiseControl: 'autoThrottle',
	Autopilot: 'autoPilot',
	ThrottleAutoLimit: 'autoThrottleLimit',
	EngineAutoControl: 'autoMix',
	RadiatorAssist: 'autoRadiator'
})

// Game paths
export const PATH_GAME_DATA = 'data'
export const PATH_GAME_EXE = path.join('bin', 'game', 'Il-2.exe')

// Check if specified game path is valid
export function isValidGamePath(gamePath) {

	if (!gamePath) {
		return false
	}

	// Check for "data" directory
	try {

		const dataPath = path.join(gamePath, PATH_GAME_DATA)
		const hasDataDirectory = fs.statSync(dataPath).isDirectory()

		if (!hasDataDirectory) {
			return false
		}
	}
	catch (e) {
		return false
	}

	// Check for game executable
	return fs.existsSync(path.join(gamePath, PATH_GAME_EXE))
}
