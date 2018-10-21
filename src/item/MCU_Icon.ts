import {SmartBuffer} from 'smart-buffer'

import {Coalition} from '../data/enums'
import {DEFAULT_BUFFER_SIZE} from './constants'
import MCU from './MCU'
import {BinaryType} from './enums'
import {Bit} from './types'
import {writeUInt32, writeUInt32Array} from './utils'

// Icon type constants
export const ICON_NONE = 0
export const ICON_ENEMY_RECON = 101
export const ICON_ENEMY_BOMBER = 102
export const ICON_ENEMY_FIGHTER = 103
export const ICON_ENEMY_DOGFIGHT = 104
export const ICON_ENEMY_DUEL = 105
export const ICON_FRIEND_RECON = 151
export const ICON_FRIEND_BOMBER = 152
export const ICON_PATROL = 201
export const ICON_RECON = 202
export const ICON_ENEMY_TRANSPORT = 501
export const ICON_ENEMY_ARMOR = 502
export const ICON_ENEMY_TANKS = 503
export const ICON_ENEMY_AAA = 504
export const ICON_ENEMY_ARTILLERY = 505
export const ICON_ENEMY_BALLOON = 506
export const ICON_ENEMY_BUILDING = 507
export const ICON_ENEMY_TRAIN = 508
export const ICON_ENEMY_SHIP = 509
export const ICON_ENEMY_BRIDGE = 510
export const ICON_ENEMY_LINE = 511
export const ICON_FRIEND_TRANSPORT = 551
export const ICON_FRIEND_ARMOR = 552
export const ICON_FRIEND_TANKS = 553
export const ICON_FRIEND_AAA = 554
export const ICON_FRIEND_ARTILLERY = 555
export const ICON_FRIEND_BALLOON = 556
export const ICON_FRIEND_BUILDING = 557
export const ICON_FRIEND_TRAIN = 558
export const ICON_FRIEND_SHIP = 559
export const ICON_FRIEND_BRIDGE = 560
export const ICON_FRIEND_LINE = 561
export const ICON_WAYPOINT = 901
export const ICON_ACTION_POINT = 902
export const ICON_TAKE_OFF = 903
export const ICON_LAND = 904
export const ICON_AIRFIELD = 905

// Line type constants
export const LINE_NORMAL = 0
export const LINE_BOLD = 1
export const LINE_BORDER = 2
export const LINE_ZONE_1 = 3
export const LINE_ZONE_2 = 4
export const LINE_ZONE_3 = 5
export const LINE_ZONE_4 = 6
export const LINE_SECTOR_1 = 7
export const LINE_SECTOR_2 = 8
export const LINE_SECTOR_3 = 9
export const LINE_SECTOR_4 = 10
export const LINE_ATTACK = 11
export const LINE_DEFEND = 12
export const LINE_POSITION_0 = 13
export const LINE_POSITION_1 = 14
export const LINE_POSITION_2 = 15
export const LINE_POSITION_3 = 16
export const LINE_POSITION_4 = 17
export const LINE_POSITION_5 = 18
export const LINE_POSITION_6 = 19
export const LINE_POSITION_7 = 20
export const LINE_POSITION_8 = 21
export const LINE_POSITION_9 = 22

// Icon item
export default class MCU_Icon extends MCU {

	public Enabled: Bit = 1
	public readonly LCName: number = 0
	public readonly LCDesc: number = 0
	public IconId = ICON_NONE
	public RColor = 0
	public GColor = 0
	public BColor = 0
	public LineType = LINE_NORMAL
	public Coalitions?: Coalition[]

	/**
	 * Set icon item color value.
	 *
	 * @param color Color value as [R, G, B] array.
	 */
	public setColor([red, green, blue]: [number, number, number]): void {

		this.RColor = red
		this.GColor = green
		this.BColor = blue
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index object.
	 * @yields Item data buffer.
	 */
	protected *toBuffer(index: any): IterableIterator<Buffer> {

		yield* super.toBuffer(index, BinaryType.MCU_Icon)

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE)

		// IconId
		writeUInt32(buffer, this.IconId)

		// RColor
		writeUInt32(buffer, this.RColor)

		// GColor
		writeUInt32(buffer, this.GColor)

		// BColor
		writeUInt32(buffer, this.BColor)

		// LineType
		writeUInt32(buffer, this.LineType)

		// LCName
		writeUInt32(buffer, this.LCName)

		// LCDesc
		writeUInt32(buffer, this.LCDesc)

		// Coalitions
		writeUInt32Array(buffer, this.Coalitions || [])

		yield buffer.toBuffer()
	}
}
