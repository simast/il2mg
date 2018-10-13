import moment, {Moment} from 'moment'

interface MatchContext {
	from: Moment
	to: Moment
	date: Moment
}

interface MatchRange {
	from: Moment
	to: Moment
}

type DateValue = string | Date

/**
 * Match a valid date range (from data files with special date from/to values).
 *
 * @param context Match context (battle from/to and target match date).
 * @param dateFrom From date range value.
 * @param dateTo To date range value. Will match to the end of the month if not
 * provided and if dateFrom is provided.
 * @returns Matched from/to range or undefined for no match.
 */
export function matchDateRange(
	context: Readonly<MatchContext>,
	dateFrom?: DateValue,
	dateTo?: DateValue
): Readonly<MatchRange> | undefined {

	const range: MatchRange = {
		from: context.from,
		to: context.to
	}

	// Always match if date range is undefined
	if (!dateFrom && !dateTo) {
		return range
	}

	if (dateFrom) {
		range.from = parseDateValue(dateFrom, context.from, context.to)
	}

	if (dateTo) {
		range.to = parseDateValue(dateTo, context.from, context.to)
	}
	// Match to the end of the month when dateTo is not provided
	else {
		range.to = moment(range.from).endOf('month')
	}

	// Match date range against specified target date
	if (!context.date.isBefore(range.from, 'day') && !context.date.isAfter(range.to, 'day')) {
		return range
	}
}

/**
 * Parse special date value into a valid Moment object.
 *
 * Example of supported date from/to value formats:
 *   - "1942-11-21" (exact date as string)
 *   - 1942-11-21 (as date type in YAML)
 *   - "start" (start of battle = context from)
 *   - "end" (end of battle = context end)
 *   - "1942-11" or "1942-11-start" (start of month)
 *   - "1942-11-end" (end of month)
 *
 * Time is not supported and should not be used in data files.
 *
 * @param value Date value from data files.
 * @param start Start date context value.
 * @param end End date context value.
 * @returns Parsed value as Moment object.
 */
function parseDateValue(value: DateValue, start: Moment, end: Moment): Moment {

	// Special "start" value means the start (min) date of the match
	if (value === 'start') {
		return start
	}
	// Special "end" value means the end (max) date of the match
	else if (value === 'end') {
		return end
	}
	// Handle value as Date object (from YAML built-in date type support)
	else if (value instanceof Date) {
		return moment(value)
	}
	// Other date format
	else {

		const [year, month, day] = value.split('-')

		if (!year || !month) {
			throw new TypeError(`Invalid date value: "${value}"`)
		}

		const date = moment()

		date.year(Number(year))
		date.month(Number(month) - 1) // Month indexed from 0

		// Only month format (YYYY-MM) or start of the month format (YYYY-MM-start)
		if (!day || day === 'start') {
			date.startOf('month')
		}
		// End of the month format (YYYY-MM-end)
		else if (day === 'end') {
			date.endOf('month')
		}
		// Full date format (YYYY-MM-DD)
		else {
			date.date(Number(day))
		}

		return date
	}
}
