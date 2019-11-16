import { Airfield } from './Airfield';
import { Block } from './Block';
import { Bridge } from './Bridge';
import { Effect } from './Effect';
import { Flag } from './Flag';
import { Ground } from './Ground';
import { Group } from './Group';
import { MCU_Activate } from './MCU_Activate';
import { MCU_CheckZone } from './MCU_CheckZone';
import { MCU_CMD_AttackArea } from './MCU_CMD_AttackArea';
import { MCU_CMD_Cover } from './MCU_CMD_Cover';
import { MCU_CMD_Effect } from './MCU_CMD_Effect';
import { MCU_CMD_ForceComplete } from './MCU_CMD_ForceComplete';
import { MCU_CMD_Formation } from './MCU_CMD_Formation';
import { MCU_CMD_Land } from './MCU_CMD_Land';
import { MCU_CMD_TakeOff } from './MCU_CMD_TakeOff';
import { MCU_Counter } from './MCU_Counter';
import { MCU_Deactivate } from './MCU_Deactivate';
import { MCU_Delete } from './MCU_Delete';
import { MCU_Icon } from './MCU_Icon';
import { MCU_Proximity } from './MCU_Proximity';
import { MCU_Spawner } from './MCU_Spawner';
import { MCU_Timer } from './MCU_Timer';
import { MCU_TR_ComplexTrigger } from './MCU_TR_ComplexTrigger';
import { MCU_TR_Entity } from './MCU_TR_Entity';
import { MCU_TR_MissionBegin } from './MCU_TR_MissionBegin';
import { MCU_TR_MissionEnd } from './MCU_TR_MissionEnd';
import { MCU_Waypoint } from './MCU_Waypoint';
import { MCU } from './MCU';
import { Options } from './Options';
import { Plane } from './Plane';
import { Train } from './Train';
import { Vehicle } from './Vehicle';

// Map of supported normal items
const itemClassByType = {
	Airfield,
	Block,
	Bridge,
	Effect,
	Flag,
	Ground,
	Group,
	MCU_Activate,
	MCU_CheckZone,
	MCU_CMD_AttackArea,
	MCU_CMD_Cover,
	MCU_CMD_Effect,
	MCU_CMD_ForceComplete,
	MCU_CMD_Formation,
	MCU_CMD_Land,
	MCU_CMD_TakeOff,
	MCU_Counter,
	MCU_Deactivate,
	MCU_Delete,
	MCU_Icon,
	MCU_Proximity,
	MCU_Spawner,
	MCU_Timer,
	MCU_TR_ComplexTrigger,
	MCU_TR_Entity,
	MCU_TR_MissionBegin,
	MCU_TR_MissionEnd,
	MCU_Waypoint,
	Options,
	Plane,
	Train,
	Vehicle,
};

// Map of supported generic items
const genericItemClassByType = {
	Damaged: Block.Damaged,
	Chart: Airfield.Chart,
	Point: Airfield.Chart.Point,
	OnEvents: MCU.OnEvents,
	OnEvent: MCU.OnEvents.OnEvent,
	OnReports: MCU.OnReports,
	OnReport: MCU.OnReports.OnReport,
};

export type ItemClassByType = typeof itemClassByType;
export type ItemType = keyof ItemClassByType;
export type ItemInstanceByType = {
	[type in ItemType]: InstanceType<ItemClassByType[type]>;
};

export type GenericItemClassByType = typeof genericItemClassByType;
export type GenericItemType = keyof GenericItemClassByType;
export type GenericItemInstanceByType = {
	[type in ItemType]: InstanceType<ItemClassByType[type]>;
};

/**
 * Test if given item type is a valid value.
 *
 * @param type Item type name.
 * @returns Boolean indicating if given item type is valid.
 */
export function isValidItemType(type: string): type is ItemType {
	return type in itemClassByType;
}

/**
 * Get item class constructor by type.
 *
 * @param type Item type name.
 * @returns Item class constructor.
 */
export function getItemClassByType<T extends ItemType>(
	type: T,
): ItemClassByType[T] {
	return itemClassByType[type];
}
