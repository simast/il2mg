import moment from 'moment'

import {Coalition, Country} from '../data/enums'
import {Item} from './item'

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
	public *toBinary(): IterableIterator<Buffer> {

		const date = moment(this.Date, 'D.M.YYYY', true)
		const time = moment(this.Time, 'H:m:s', true)

		const hmapLength = Buffer.byteLength(this.HMap)
		const texturesLength = Buffer.byteLength(this.Textures)
		const forestsLength = Buffer.byteLength(this.Forests)
		const guiMapLength = Buffer.byteLength(this.GuiMap)
		const layersLength = Buffer.byteLength(this.Layers)
		const seasonPrefixLength = Buffer.byteLength(this.SeasonPrefix)
		const playerConfigLength = Buffer.byteLength(this.PlayerConfig)
		const cloudConfigLength = Buffer.byteLength(this.CloudConfig)

		let size = 144

		size += hmapLength
		size += texturesLength
		size += forestsLength
		size += guiMapLength
		size += layersLength
		size += seasonPrefixLength
		size += playerConfigLength
		size += cloudConfigLength

		size += this.WindLayers.length * 8 * 3
		size += this.Countries.length * 4 * 2

		const buffer = Buffer.allocUnsafe(size)

		// File version?
		this.writeUInt32(buffer, 28)

		// MissionType
		this.writeUInt32(buffer, this.MissionType)

		// AqmId
		this.writeUInt32(buffer, this.AqmId)

		// Day
		this.writeUInt32(buffer, date.date())

		// Month
		this.writeUInt32(buffer, date.month() + 1)

		// Year
		this.writeUInt32(buffer, date.year())

		// Seconds
		this.writeUInt32(buffer, time.seconds())

		// Minutes
		this.writeUInt32(buffer, time.minutes())

		// Hours
		this.writeUInt32(buffer, time.hours())

		// HMap
		this.writeString(buffer, hmapLength, this.HMap)

		// Textures
		this.writeString(buffer, texturesLength, this.Textures)

		// Forests
		this.writeString(buffer, forestsLength, this.Forests)

		// Layers
		this.writeString(buffer, layersLength, this.Layers)

		// GuiMap
		this.writeString(buffer, guiMapLength, this.GuiMap)

		// SeasonPrefix
		this.writeString(buffer, seasonPrefixLength, this.SeasonPrefix)

		// LCName
		this.writeUInt32(buffer, this.LCName)

		// LCAuthor
		this.writeUInt32(buffer, this.LCAuthor)

		// LCDesc
		this.writeUInt32(buffer, this.LCDesc)

		// PlayerConfig
		this.writeString(buffer, playerConfigLength, this.PlayerConfig)

		// Unknown 4 bytes (always zero)
		// TODO: Investigate, could this be a non-localized indexed Name and Desc properties?
		this.writeUInt32(buffer, 0)

		// CloudLevel
		this.writeUInt32(buffer, this.CloudLevel)

		// CloudHeight
		this.writeUInt32(buffer, this.CloudHeight)

		// PrecLevel
		this.writeUInt32(buffer, this.PrecLevel)

		// PrecType
		this.writeUInt32(buffer, this.PrecType)

		// Turbulence
		this.writeDouble(buffer, this.Turbulence)

		// TempPressLevel
		this.writeDouble(buffer, this.TempPressLevel)

		// Temperature
		this.writeDouble(buffer, this.Temperature)

		// Pressure
		this.writeDouble(buffer, this.Pressure)

		// CloudConfig
		this.writeString(buffer, cloudConfigLength, this.CloudConfig)

		// SeaState
		this.writeUInt32(buffer, this.SeaState)

		// WindLayers length
		this.writeUInt32(buffer, this.WindLayers.length)

		// WindLayers
		this.WindLayers.forEach(([height, direction, speed]) => {

			// WindLayer ground height
			this.writeDouble(buffer, height)

			// WindLayer direction
			this.writeDouble(buffer, direction)

			// WindLayer speed
			this.writeDouble(buffer, speed)
		})

		// Countries length
		this.writeUInt32(buffer, this.Countries.length)

		// Countries
		this.Countries.forEach(([countryId, coalitionId]) => {

			// Country ID
			this.writeUInt32(buffer, countryId)

			// Coalition ID
			this.writeUInt32(buffer, coalitionId)
		})

		yield buffer
	}
}
