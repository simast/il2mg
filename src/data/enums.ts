// Coalitions
export enum Coalition {
	Neutral = 0,
	Allies = 1,
	Axis = 2,
}

// Countries
export enum Country {
	SovietUnion = 101,
	Germany = 201,
	Romania = 202,
}

// Data tags for special airfield items
export enum ItemTag {
	Plane = -1, // Plane spot
	CargoTruck = -2, // Cargo truck
	FuelTruck = -3, // Fuel truck
	Car = -4, // Car vehicle
	AntiAircraftMG = -5, // Anti-aircraft (MG)
	AntiAircraftFlak = -6, // Anti-aircraft (Flak)
	AntiAircraftTrain = -7, // Anti-aircraft (Train platform)
	SearchLight = -8, // Search light
	LandingLight = -9, // Landing light
	Beacon = -10, // Beacon
	Windsock = -11, // Windsock
	Effect = -12, // Effect
	Wreck = -13, // Wreckage
}

// Data flags for airfield items
export enum ItemFlag {
	BlockDecoration = 1, // Decoration
	BlockFuel = 2, // Fuel item
	PlaneCamouflage = 1, // Camouflage plane spot
	EffectSmoke = 1, // House smoke effect
	EffectCampFire = 2, // Campfire effect
	EffectLandFire = 3, // Landing fire effect
	EffectSiren = 4, // Siren effect
	TaxiInvertible = 1, // Invertible taxi route
	TaxiRunway = 1, // Taxi runway point
	RouteStop = 1, // Route stop point
	RouteRoad = 2, // Route road formation
}

// Vehicle types
export const enum VehicleType {
	Truck = 'truck',
	TruckCargo = 'truck_cargo',
	TruckFuel = 'truck_fuel',
	AntiAir = 'aa',
	AntiAirFlak = 'aa_flak',
	AntiAirFlakLight = 'aa_flak_light',
	AntiAirFlakHeavy = 'aa_flak_heavy',
	AntiAirMG = 'aa_mg',
	AntiAirMobile = 'aa_mobile',
	Tank = 'tank',
	TankHeavy = 'tank_heavy',
	TankMedium = 'tank_medium',
	TankLight = 'tank_light',
	TankDestroyer = 'tank_destroyer',
	ArmoredCar = 'armored_car',
	Scout = 'scout',
	ArmoredPersonnelCarrier = 'apc',
	RocketArtillery = 'rocket_artillery',
	StaffCar = 'staff_car',
	MachineGun = 'mg',
	Artillery = 'artillery',
	ArtilleryHowitzer = 'artillery_howitzer',
	AntiTankGun = 'at_gun',
	LandingLight = 'landing_light',
	SearchLight = 'search_light',
	Train = 'train',
	TrainAntiAir = 'train_aa',
}

// Named time periods
export const enum TimePeriod {
	Dawn = 'dawn',
	Sunrise = 'sunrise',
	Morning = 'morning',
	Day = 'day',
	Noon = 'noon',
	Afternoon = 'afternoon',
	Evening = 'evening',
	Sunset = 'sunset',
	Dusk = 'dusk',
	Night = 'night',
	Midnight = 'midnight',
}

// Callsign groups
export const enum CallsignGroup {
	Plane = 'plane',
	Airfield = 'airfield',
	Vehicle = 'vehicle',
}

// Task types
export const enum TaskType {
	Cover = 'cover',
	Free = 'free',
	Patrol = 'patrol',
	Rebase = 'rebase',
	Sweep = 'sweep',
}

// Altitude level types
export const enum AltitudeLevel {
	Low = 'low',
	Medium = 'medium',
	High = 'high',
}

// Plane types
export const enum PlaneType {
	Fighter = 'fighter',
	FighterLight = 'fighter_light',
	FighterHeavy = 'fighter_heavy',
	GroundAttack = 'ground_attack',
	DiveBomber = 'dive_bomber',
	LevelBomber = 'level_bomber',
	Transport = 'transport',
}

// Plane sizes
export const enum PlaneSize {
	Small = 'small',
	Medium = 'medium',
	Large = 'large',
	Huge = 'huge',
}

// Rank types
export const enum RankType {
	Pilot = 'pilot',
	Leader = 'leader',
	Liaison = 'liaison',
	Commander = 'commander',
	AntiAir = 'aa',
	Brass = 'brass',
}

// Map season types
// NOTE: Order is important (used when defining plane skins for each season)!
export enum MapSeason {
	Spring = 'spring',
	Summer = 'summer',
	Autumn = 'autumn',
	Winter = 'winter',
	Desert = 'desert',
}
