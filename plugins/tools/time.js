// ╭──────────────────────────────────────────────╮
// │          XPRO-MD WORLD CLOCK SYSTEM          │
// │              Powered by XPRO TECH            │
// ╰──────────────────────────────────────────────╯

const DEFAULT_ZONE = 'Africa/Harare'

const popularZones = {
  harare: 'Africa/Harare',
  zimbabwe: 'Africa/Harare',
  zambia: 'Africa/Lusaka',
  southafrica: 'Africa/Johannesburg',
  johannesburg: 'Africa/Johannesburg',
  nigeria: 'Africa/Lagos',
  lagos: 'Africa/Lagos',
  kenya: 'Africa/Nairobi',
  nairobi: 'Africa/Nairobi',
  egypt: 'Africa/Cairo',
  london: 'Europe/London',
  uk: 'Europe/London',
  paris: 'Europe/Paris',
  germany: 'Europe/Berlin',
  berlin: 'Europe/Berlin',
  moscow: 'Europe/Moscow',
  dubai: 'Asia/Dubai',
  india: 'Asia/Kolkata',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  pakistan: 'Asia/Karachi',
  china: 'Asia/Shanghai',
  shanghai: 'Asia/Shanghai',
  japan: 'Asia/Tokyo',
  tokyo: 'Asia/Tokyo',
  korea: 'Asia/Seoul',
  singapore: 'Asia/Singapore',
  thailand: 'Asia/Bangkok',
  indonesia: 'Asia/Jakarta',
  australia: 'Australia/Sydney',
  sydney: 'Australia/Sydney',
  perth: 'Australia/Perth',
  'new york': 'America/New_York',
  'newyork': 'America/New_York',
  'los angeles': 'America/Los_Angeles',
  'losangeles': 'America/Los_Angeles',
  chicago: 'America/Chicago',
  canada: 'America/Toronto',
  toronto: 'America/Toronto',
  brazil: 'America/Sao_Paulo',
  mexico: 'America/Mexico_City',
  'new zealand': 'Pacific/Auckland',
  'newzealand': 'Pacific/Auckland',
  hawaii: 'Pacific/Honolulu',
  utc: 'UTC'
}

const clocks = [
  ['🇿🇼', 'Harare', 'Africa/Harare'],
  ['🇬🇧', 'London', 'Europe/London'],
  ['🇺🇸', 'New York', 'America/New_York'],
  ['🇺🇸', 'Los Angeles', 'America/Los_Angeles'],
  ['🇿🇦', 'Johannesburg', 'Africa/Johannesburg'],
  ['🇳🇬', 'Lagos', 'Africa/Lagos'],
  ['🇦🇪', 'Dubai', 'Asia/Dubai'],
  ['🇮🇳', 'New Delhi', 'Asia/Kolkata'],
  ['🇯🇵', 'Tokyo', 'Asia/Tokyo'],
  ['🇨🇳', 'Shanghai', 'Asia/Shanghai'],
  ['🇸🇬', 'Singapore', 'Asia/Singapore'],
  ['🇦🇺', 'Sydney', 'Australia/Sydney'],
  ['🇧🇷', 'Sao Paulo', 'America/Sao_Paulo'],
  ['🇨🇦', 'Toronto', 'America/Toronto'],
  ['🇳🇿', 'Auckland', 'Pacific/Auckland'],
  ['🌍', 'UTC', 'UTC']
]

const safeReply = async (m, message) => {
  try {
    if (!m?.reply) return false
    await m.reply(message)
    return true
  } catch (error) {
    console.error('[XPRO TIME REPLY ERROR]', error.message)
    return false
  }
}

const resolveZone = input => {
  const value = input.trim()

  if (!value) return DEFAULT_ZONE

  const normalized = value.toLowerCase()

  if (popularZones[normalized]) {
    return popularZones[normalized]
  }

  // Allow direct IANA timezone identifiers
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: value
    })

    return formatter.resolvedOptions().timeZone
  } catch {
    return null
  }
}

const getTimeData = zone => {
  const now = new Date()

  const dateOptions = {
    timeZone: zone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  const timeOptions = {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }

  const hourOptions = {
    timeZone: zone,
    hour: '2-digit',
    hourCycle: 'h23'
  }

  const offsetOptions = {
    timeZone: zone,
    timeZoneName: 'longOffset',
    hour: '2-digit'
  }

  const hour = Number(
    new Intl.DateTimeFormat('en', hourOptions)
      .format(now)
  )

  const timeParts = new Intl.DateTimeFormat(
    'en-US',
    offsetOptions
  ).formatToParts(now)

  const offset = timeParts.find(
    part => part.type === 'timeZoneName'
  )?.value || 'GMT'

  return {
    date: new Intl.DateTimeFormat('en-US', dateOptions).format(now),
    time: new Intl.DateTimeFormat('en-US', timeOptions).format(now),
    time24: new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).format(now),
    hour,
    offset,
    period: hour >= 6 && hour < 18 ? '☀️ Daytime' : '🌙 Nighttime',
    zone
  }
}

const getClock = (flag, name, zone) => {
  try {
    const data = getTimeData(zone)

    return `${flag} *${name}*
🕒 ${data.time}
📅 ${data.date}
🌐 ${data.offset}`
  } catch {
    return `${flag} *${name}*\n❌ Time unavailable`
  }
}

let handler = async (m, { text, prefix }) => {
  const input = text?.trim() || ''

  try {
    // WORLD CLOCK
    if (['world', 'worldclock', 'all'].includes(input.toLowerCase())) {
      let output = `
╭━━━━━━━━━━━━━━━━━━╮
      🌍 *XPRO WORLD CLOCK*
╰━━━━━━━━━━━━━━━━━━╯

`

      for (const [flag, name, zone] of clocks) {
        output += getClock(flag, name, zone) + '\n\n'
      }

      output += `━━━━━━━━━━━━━━━━━━
> 🌐 Powered by *XPRO TECH*`

      return safeReply(m, output.trim())
    }

    // FORMAT OPTIONS
    const formatMatch = input.match(
      /^(?:format|12h|24h)\s+(.+)$/i
    )

    if (formatMatch) {
      const zone = resolveZone(formatMatch[1])

      if (!zone) {
        return safeReply(m, `❌ Invalid timezone: *${formatMatch[1]}*`)
      }

      const now = new Date()

      const time12 = new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now)

      const time24 = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      }).format(now)

      return safeReply(m,
        `🕒 *XPRO CLOCK FORMAT*\n\n` +
        `🌍 Timezone: ${zone}\n` +
        `🕰️ 12-hour: ${time12}\n` +
        `🕰️ 24-hour: ${time24}\n\n` +
        `> Powered by XPRO TECH`
      )
    }

    // COMPARE TWO TIMEZONES
    const compareMatch = input.match(
      /^(?:compare)\s+(.+?)\s+(?:vs|and|to)\s+(.+)$/i
    )

    if (compareMatch) {
      const zone1 = resolveZone(compareMatch[1])
      const zone2 = resolveZone(compareMatch[2])

      if (!zone1 || !zone2) {
        return safeReply(m,
          `❌ Invalid timezone.\n\n` +
          `Example: ${prefix}time compare Harare vs London`
        )
      }

      const data1 = getTimeData(zone1)
      const data2 = getTimeData(zone2)

      return safeReply(m,
        `╭━━━━━━━━━━━━━━━━━━╮\n` +
        `   🌍 *TIME COMPARISON*\n` +
        `╰━━━━━━━━━━━━━━━━━━╯\n\n` +
        `📍 *${zone1}*\n` +
        `🕒 ${data1.time}\n` +
        `📅 ${data1.date}\n` +
        `🌐 ${data1.offset}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `📍 *${zone2}*\n` +
        `🕒 ${data2.time}\n` +
        `📅 ${data2.date}\n` +
        `🌐 ${data2.offset}\n\n` +
        `> ✨ Powered by XPRO TECH`
      )
    }

    // NORMAL TIME LOOKUP
    const zone = resolveZone(input)

    if (!zone) {
      return safeReply(m,
        `❌ *TIMEZONE NOT FOUND*\n\n` +
        `You entered: *${input}*\n\n` +
        `Try:\n` +
        `• ${prefix}time Harare\n` +
        `• ${prefix}time London\n` +
        `• ${prefix}time Asia/Tokyo\n` +
        `• ${prefix}time America/New_York\n` +
        `• ${prefix}time world`
      )
    }

    const data = getTimeData(zone)

    const output = `
╭━━━━━━━━━━━━━━━━━━╮
      🕒 *XPRO WORLD TIME*
╰━━━━━━━━━━━━━━━━━━╯

🌍 *Timezone:* ${data.zone}

🕰️ *Current Time*
${data.time}

⏱️ *24-Hour Format*
${data.time24}

📅 *Date*
${data.date}

🌐 *GMT Offset*
${data.offset}

${data.period}

━━━━━━━━━━━━━━━━━━
🌎 *WORLD TIME SERVICE*
> ✨ Powered by *XPRO TECH*
> 🤖 XPRO-MD
`

    return safeReply(m, output.trim())

  } catch (error) {
    console.error('[XPRO TIME ERROR]', error)

    return safeReply(m,
      `❌ *TIME SERVICE ERROR*\n\n` +
      `Unable to retrieve the requested time.\n` +
      `Please try again.\n\n` +
      `> XPRO TECH`
    )
  }
}

handler.command = ['time', 'clock', 'worldtime', 'timezone', 'worldclock']
handler.help = [
  'time',
  'time <city/timezone>',
  'time world',
  'time compare <city1> vs <city2>',
  'time format <timezone>'
]
handler.tags = ['tools']

export default handler
