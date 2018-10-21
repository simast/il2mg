import moment from 'moment'
import {SmartBuffer} from 'smart-buffer'

import {Coalition, Country} from '../data/enums'
import {Item} from './item'
import {writeUInt32, writeString, writeDouble} from './utils'

// Options item
export default class Options extends Item {

	public Date = ''
	public Time = ''
	public HMap = ''
	public Textures = ''
	public Forests = ''
	public GuiMap = ''
	public Layers = ''
	public SeasonPrefix = ''
	public PlayerConfig = ''
	public CloudConfig = ''
	public MissionType = 0
	public AqmId = 0
	public WindLayers: [number, number, number][] = []
	public Countries: [Country, Coalition][] = []
	public readonly LCName: number = 0
	public LCAuthor: number = 0
	public readonly LCDesc: number = 0
	public CloudLevel = 0
	public CloudHeight = 0
	public PrecLevel = 0
	public PrecType = 0
	public Turbulence = 0
	public TempPressLevel = 0
	public Temperature = 0
	public Pressure = 0
	public SeaState = 0

	get hasIndex() {return false}

	/**
	 * Get binary representation of the item.
	 *
	 * @yields Item data buffer.
	 */
	protected *toBuffer(): IterableIterator<Buffer> {

		const buffer = new SmartBuffer()

		const date = moment(this.Date, 'D.M.YYYY', true)
		const time = moment(this.Time, 'H:m:s', true)

		// File version?
		writeUInt32(buffer, 28)

		// MissionType
		writeUInt32(buffer, this.MissionType)

		// AqmId
		writeUInt32(buffer, this.AqmId)

		// Day
		writeUInt32(buffer, date.date())

		// Month
		writeUInt32(buffer, date.month() + 1)

		// Year
		writeUInt32(buffer, date.year())

		// Seconds
		writeUInt32(buffer, time.seconds())

		// Minutes
		writeUInt32(buffer, time.minutes())

		// Hours
		writeUInt32(buffer, time.hours())

		// HMap
		writeString(buffer, this.HMap)

		// Textures
		writeString(buffer, this.Textures)

		// Forests
		writeString(buffer, this.Forests)

		// Layers
		writeString(buffer, this.Layers)

		// GuiMap
		writeString(buffer, this.GuiMap)

		// SeasonPrefix
		writeString(buffer, this.SeasonPrefix)

		// LCName
		writeUInt32(buffer, this.LCName)

		// LCAuthor
		writeUInt32(buffer, this.LCAuthor)

		// LCDesc
		writeUInt32(buffer, this.LCDesc)

		// PlayerConfig
		writeString(buffer, this.PlayerConfig)

		// Unknown 4 bytes (always zero)
		// TODO: Investigate, could this be a non-localized indexed Name and Desc properties?
		writeUInt32(buffer, 0)

		// CloudLevel
		writeUInt32(buffer, this.CloudLevel)

		// CloudHeight
		writeUInt32(buffer, this.CloudHeight)

		// PrecLevel
		writeUInt32(buffer, this.PrecLevel)

		// PrecType
		writeUInt32(buffer, this.PrecType)

		// Turbulence
		writeDouble(buffer, this.Turbulence)

		// TempPressLevel
		writeDouble(buffer, this.TempPressLevel)

		// Temperature
		writeDouble(buffer, this.Temperature)

		// Pressure
		writeDouble(buffer, this.Pressure)

		// CloudConfig
		writeString(buffer, this.CloudConfig)

		// SeaState
		writeUInt32(buffer, this.SeaState)

		// WindLayers length
		writeUInt32(buffer, this.WindLayers.length)

		// WindLayers
		this.WindLayers.forEach(([height, direction, speed]) => {

			// WindLayer ground height
			writeDouble(buffer, height)

			// WindLayer direction
			writeDouble(buffer, direction)

			// WindLayer speed
			writeDouble(buffer, speed)
		})

		// Countries length
		writeUInt32(buffer, this.Countries.length)

		// Countries
		this.Countries.forEach(([countryId, coalitionId]) => {

			// Country ID
			writeUInt32(buffer, countryId)

			// Coalition ID
			writeUInt32(buffer, coalitionId)
		})

		yield buffer.toBuffer()
	}
}
