// Coalitions
export enum Coalition {
	Neutral = 0,
	Allies = 1,
	Axis = 2
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
	Wreck = -13 // Wreckage
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
	RouteRoad = 2 // Route road formation
}
