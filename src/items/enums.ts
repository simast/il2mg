// Binary type
export const enum BinaryType {
	Block = 1,
	Vehicle = 2,
	Plane = 3,
	Bridge = 5,
	Ground = 7,
	Train = 8,
	Airfield = 9,
	Effect = 10,
	Flag = 13,
	MCU_CMD_TakeOff = 15,
	MCU_CMD_Land = 16,
	MCU_CMD_Formation = 19,
	MCU_CMD_AttackArea = 20,
	MCU_CMD_ForceComplete = 24,
	MCU_CMD_Cover = 25,
	MCU_CMD_Effect = 26,
	MCU_TR_MissionBegin = 28,
	MCU_TR_MissionEnd = 29,
	MCU_TR_Entity = 30,
	MCU_Icon = 35,
	MCU_TR_ComplexTrigger = 40,
	MCU_Timer = 41,
	MCU_Waypoint = 42,
	MCU_Counter = 43,
	MCU_Activate = 44,
	MCU_Deactivate = 45,
	MCU_CheckZone = 46,
	MCU_Spawner = 48,
	MCU_Proximity = 49,
	MCU_Delete = 50,
}

// Priority type
export const enum Priority {
	Low = 0,
	Medium = 1,
	High = 2,
}

export { EffectAction } from './MCU_CMD_Effect';
export { FormationType, FormationDensity } from './MCU_CMD_Formation';
export { IconType, IconLine } from './MCU_Icon';
export { PlaneAILevel, PlaneStart } from './Plane';
export { VehicleAILevel } from './Vehicle';
