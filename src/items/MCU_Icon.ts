import { SmartBuffer } from 'smart-buffer';

import { Coalition } from '../data/enums';
import { BinaryIndexTables } from '../mission/types';
import { DEFAULT_BUFFER_SIZE } from './constants';
import { MCU } from './MCU';
import { BinaryType } from './enums';
import { Bit } from './types';
import { writeUInt32, writeUInt32Array } from './utils';

// Icon type
export const enum IconType {
	None = 0,
	EnemyRecon = 101,
	EnemyBomber = 102,
	EnemyFighter = 103,
	EnemyDogfight = 104,
	EnemyDuel = 105,
	FriendRecon = 151,
	FriendBomber = 152,
	Patrol = 201,
	Recon = 202,
	EnemyTransport = 501,
	EnemyArmor = 502,
	EnemyTanks = 503,
	EnemyAAA = 504,
	EnemyArtillery = 505,
	EnemyBalloon = 506,
	EnemyBuilding = 507,
	EnemyTrain = 508,
	EnemyShip = 509,
	EnemyBridge = 510,
	EnemyLine = 511,
	FriendTransport = 551,
	FriendArmor = 552,
	FriendTanks = 553,
	FriendAAA = 554,
	FriendArtillery = 555,
	FriendBalloon = 556,
	FriendBuilding = 557,
	FriendTrain = 558,
	FriendShip = 559,
	FriendBridge = 560,
	FriendLine = 561,
	Waypoint = 901,
	ActionPoint = 902,
	TakeOff = 903,
	Land = 904,
	Airfield = 905,
}

// Icon line type
export const enum IconLine {
	Normal = 0,
	Bold = 1,
	Border = 2,
	Zone1 = 3,
	Zone2 = 4,
	Zone3 = 5,
	Zone4 = 6,
	Sector1 = 7,
	Sector2 = 8,
	Sector3 = 9,
	Sector4 = 10,
	Attack = 11,
	Defend = 12,
	Position0 = 13,
	Position1 = 14,
	Position2 = 15,
	Position3 = 16,
	Position4 = 17,
	Position5 = 18,
	Position6 = 19,
	Position7 = 20,
	Position8 = 21,
	Position9 = 22,
}

// Icon item
export class MCU_Icon extends MCU {
	public Enabled: Bit = 1;
	public readonly LCName: number = 0;
	public readonly LCDesc: number = 0;
	public IconId = IconType.None;
	public RColor = 0;
	public GColor = 0;
	public BColor = 0;
	public LineType = IconLine.Normal;
	public Coalitions?: Coalition[];

	/**
	 * Set icon item color value.
	 *
	 * @param color Color value as [R, G, B] array.
	 */
	public setColor([red, green, blue]: [number, number, number]): void {
		this.RColor = red;
		this.GColor = green;
		this.BColor = blue;
	}

	/**
	 * Get binary representation of the item.
	 *
	 * @param index Binary data index tables.
	 * @yields Item data buffer.
	 */
	public *toBuffer(index: BinaryIndexTables): IterableIterator<Buffer> {
		yield* super.toBuffer(index, BinaryType.MCU_Icon);

		const buffer = SmartBuffer.fromSize(DEFAULT_BUFFER_SIZE);

		// IconId
		writeUInt32(buffer, this.IconId);

		// RColor
		writeUInt32(buffer, this.RColor);

		// GColor
		writeUInt32(buffer, this.GColor);

		// BColor
		writeUInt32(buffer, this.BColor);

		// LineType
		writeUInt32(buffer, this.LineType);

		// LCName
		writeUInt32(buffer, this.LCName);

		// LCDesc
		writeUInt32(buffer, this.LCDesc);

		// Coalitions
		writeUInt32Array(buffer, this.Coalitions ?? []);

		yield buffer.toBuffer();
	}
}
