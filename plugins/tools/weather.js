// ╭──────────────────────────────────────────────╮
// │       XPRO-MD PROFESSIONAL WEATHER SYSTEM    │
// │              Powered by XPRO TECH            │
// ╰──────────────────────────────────────────────╯

import axios from 'axios'

const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'

const api = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'XPRO-MD-Weather/2.0',
    Accept: 'application/json'
  }
})

// WMO Weather interpretation codes
const weatherCodes = {
  0: ['☀️', 'Clear Sky'],
  1: ['🌤️', 'Mainly Clear'],
  2: ['⛅', 'Partly Cloudy'],
  3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Depositing Rime Fog'],
  51: ['🌦️', 'Light Drizzle'],
  53: ['🌦️', 'Moderate Drizzle'],
  55: ['🌧️', 'Dense Drizzle'],
  56: ['🌧️', 'Freezing Drizzle'],
  57: ['🌧️', 'Heavy Freezing Drizzle'],
  61: ['🌧️', 'Slight Rain'],
  63: ['🌧️', 'Moderate Rain'],
  65: ['🌧️', 'Heavy Rain'],
  66: ['🌧️', 'Freezing Rain'],
  67: ['🌧️', 'Heavy Freezing Rain'],
  71: ['🌨️', 'Slight Snowfall'],
  73: ['❄️', 'Moderate Snowfall'],
  75: ['❄️', 'Heavy Snowfall'],
  77: ['🌨️', 'Snow Grains'],
  80: ['🌦️', 'Slight Rain Showers'],
  81: ['🌧️', 'Moderate Rain Showers'],
  82: ['⛈️', 'Violent Rain Showers'],
  85: ['🌨️', 'Slight Snow Showers'],
  86: ['❄️', 'Heavy Snow Showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm With Hail'],
  99: ['⛈️', 'Severe Thunderstorm With Hail']
}

const getWeather = code => weatherCodes[code] || ['🌤️', 'Unknown Conditions']

const formatTime = value => {
  if (!value) return 'N/A'
  return value.split('T')[1] || value
}

const formatDate = value => {
  if (!value) return 'N/A'

  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  }).format(new Date(`${value}T12:00:00`))
}

const getWindDirection = degrees => {
  if (degrees == null) return 'N/A'

  const directions = [
    'North', 'North-East', 'East', 'South-East',
    'South', 'South-West', 'West', 'North-West'
  ]

  return directions[Math.round(degrees / 45) % 8]
}

const safe = (value, unit = '') =>
  value == null ? 'N/A' : `${value}${unit}`

let handler = async (m, { text }) => {
  const city = text?.trim() || 'Harare'

  try {
    await m.reply(`🌍 *XPRO WEATHER SERVICE*\n\n🔎 Checking weather for *${city}*...`)

    // STEP 1: Find city coordinates
    const geoResponse = await api.get(GEO_API, {
      params: {
        name: city,
        count: 5,
        language: 'en',
        format: 'json'
      }
    })

    const results = geoResponse.data?.results

    if (!Array.isArray(results) || !results.length) {
      return m.reply(
        `❌ *LOCATION NOT FOUND*\n\n` +
        `I couldn't find: *${city}*\n\n` +
        `Try searching for:\n` +
        `• Harare\n` +
        `• Bulawayo\n` +
        `• London\n` +
        `• Tokyo\n` +
        `• Johannesburg`
      )
    }

    // Prefer an exact city-name match
    const place = results.find(
      item => item.name.toLowerCase() === city.toLowerCase()
    ) || results[0]

    const { latitude, longitude } = place

    const location = [
      place.name,
      place.admin1,
      place.country
    ].filter(Boolean).join(', ')

    // STEP 2: Retrieve weather information
    const weatherResponse = await api.get(WEATHER_API, {
      params: {
        latitude,
        longitude,
        timezone: 'auto',

        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'is_day',
          'precipitation',
          'rain',
          'showers',
          'weather_code',
          'cloud_cover',
          'pressure_msl',
          'wind_speed_10m',
          'wind_direction_10m',
          'wind_gusts_10m'
        ].join(','),

        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'sunrise',
          'sunset',
          'precipitation_probability_max',
          'uv_index_max'
        ].join(','),

        forecast_days: 3,

        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
        precipitation_unit: 'mm'
      }
    })

    const data = weatherResponse.data
    const current = data.current
    const daily = data.daily

    if (!current || !daily?.time?.length) {
      throw new Error('Weather information is temporarily unavailable.')
    }

    const [icon, condition] = getWeather(current.weather_code)

    const isDay = current.is_day === 1 ? '🌞 Daytime' : '🌙 Nighttime'

    // STEP 3: Current weather report
    let report = `
╭━━━━━━━━━━━━━━━━━━╮
     🌍 *XPRO WEATHER*
╰━━━━━━━━━━━━━━━━━━╯

📍 *LOCATION*
${location}

🕒 *Local Time:* ${formatTime(current.time)}
${isDay}

━━━━━━━━━━━━━━━━━━
🌡️ *CURRENT CONDITIONS*
━━━━━━━━━━━━━━━━━━

${icon} *Weather:* ${condition}

🌡️ *Temperature:* ${safe(current.temperature_2m, '°C')}
🤔 *Feels Like:* ${safe(current.apparent_temperature, '°C')}
💧 *Humidity:* ${safe(current.relative_humidity_2m, '%')}
☁️ *Cloud Cover:* ${safe(current.cloud_cover, '%')}

🌧️ *Precipitation:* ${safe(current.precipitation, ' mm')}
🌦️ *Rain:* ${safe(current.rain, ' mm')}
🌧️ *Showers:* ${safe(current.showers, ' mm')}

💨 *Wind Speed:* ${safe(current.wind_speed_10m, ' km/h')}
🧭 *Wind Direction:* ${getWindDirection(current.wind_direction_10m)}
🌪️ *Wind Gusts:* ${safe(current.wind_gusts_10m, ' km/h')}

🔵 *Pressure:* ${safe(current.pressure_msl, ' hPa')}

━━━━━━━━━━━━━━━━━━
📅 *3-DAY FORECAST*
━━━━━━━━━━━━━━━━━━`

    // STEP 4: Forecast
    for (let i = 0; i < daily.time.length; i++) {
      const [dayIcon, dayCondition] = getWeather(daily.weather_code[i])

      const label = i === 0
        ? 'TODAY'
        : i === 1
          ? 'TOMORROW'
          : 'UPCOMING DAY'

      report += `

${i === 0 ? '📌' : '📆'} *${label}*
🗓️ ${formatDate(daily.time[i])}

${dayIcon} ${dayCondition}

🌡️ High: ${safe(daily.temperature_2m_max[i], '°C')}
🥶 Low: ${safe(daily.temperature_2m_min[i], '°C')}
🌧️ Rain Chance: ${safe(daily.precipitation_probability_max[i], '%')}
☀️ UV Index: ${safe(daily.uv_index_max[i])}`

      if (i === 0) {
        report += `
🌅 Sunrise: ${formatTime(daily.sunrise[i])}
🌇 Sunset: ${formatTime(daily.sunset[i])}`
      }
    }

    report += `

━━━━━━━━━━━━━━━━━━
📡 *DATA PROVIDER*
prodev-ofc.com/xprotech-weather.api

> ✨ Powered by *XPRO TECH*
> 🤖 *XPRO-MD Weather System*`

    return m.reply(report.trim())

  } catch (error) {
    console.error(
      '[XPRO WEATHER ERROR]',
      error.response?.data || error.message
    )

    let message = 'Unable to retrieve weather information.'

    if (error.code === 'ECONNABORTED') {
      message = 'Weather request timed out. Please try again.'
    } else if (error.response?.status === 429) {
      message = 'Weather service is receiving too many requests. Try again shortly.'
    } else if (error.response?.status >= 500) {
      message = 'Weather provider is temporarily unavailable.'
    }

    return m.reply(
      `❌ *WEATHER SERVICE ERROR*\n\n` +
      `${message}\n\n` +
      `📍 Location: ${city}\n` +
      `🔄 Please try again later.\n\n` +
      `> XPRO TECH`
    )
  }
}

handler.command = ['weather', 'w', 'forecast']
handler.help = ['weather <city>', 'forecast <city>']
handler.tags = ['tools']

export default handler
