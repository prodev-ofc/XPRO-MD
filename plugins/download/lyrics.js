import axios from 'axios'
import yts from 'yt-search'

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    Accept: 'application/json'
}

const apiError = (data, fallback) => {
    if (typeof data === 'string' && data.trim()) return data.trim().slice(0, 200)
    if (typeof data?.error === 'string') return data.error
    if (data?.message) return String(data.message)
    return fallback
}

const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim()

// === PRODEV ZW QUOTED HEADER - SAME AS myfunc.js ===
const quotedMessage = {
    key: {
        remoteJid: 'status@broadcast',
        fromMe: false,
        id: 'EliteProTech',
        participant: '13135550002@s.whatsapp.net'
    },
    message: {
        locationMessage: {
            degreesLatitude: -6.200000,
            degreesLongitude: 106.816666,
            name: '𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖',
            address: '𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖',
            jpegThumbnail: null
        }
    }
}

// Split full lyrics into chunks without cutting lines in half
const chunkLyrics = (text, max = 3500) => {
    const lines = text.split('\n')
    const chunks = []
    let current = ''
    for (const line of lines) {
        if ((current + '\n' + line).length > max) {
            if (current) chunks.push(current.trim())
            current = line
        } else {
            current += (current ? '\n' : '') + line
        }
    }
    if (current.trim()) chunks.push(current.trim())
    return chunks
}

let handler = async (m, { EliteProTech, text = '' }) => {
    const query = String(text).trim()
    if (!query) return EliteProTech.sendMessage(m.chat, { text: `*Usage:* ${global.prefix || '.'}lyrics <song name>\n*Example:* ${global.prefix || '.'}lyrics Asake - Why Love` }, { quoted: quotedMessage })

    let artist = ''
    let title = query
    if (query.includes('-')) {
        const parts = query.split('-')
        artist = cleanText(parts[0])
        title = cleanText(parts.slice(1).join('-'))
    }

    let video
    try {
        const search = await yts(query)
        video = search.videos?.[0]
        if (video?.title && !artist) {
            if (video.title.includes('-')) {
                const p = video.title.split('-')
                artist = cleanText(p[0])
                title = cleanText(p.slice(1).join('-'))
            } else {
                title = cleanText(video.title)
                artist = cleanText(video.author?.name || '')
            }
        }
    } catch {}

    if (!title) return EliteProTech.sendMessage(m.chat, { text: `No results found for "${query}".` }, { quoted: quotedMessage })

    await EliteProTech.sendMessage(m.chat, { text: `Searching lyrics for *${artist ? artist + ' - ' : ''}${title}*...` }, { quoted: quotedMessage })

    try {
        let lyrics = ''
        let foundTitle = title
        let foundArtist = artist

        // 1. LRCLIB - best, full lyrics
        try {
            const res = await axios.get('https://lrclib.net/api/search', {
                params: { track_name: title, artist_name: artist || undefined },
                timeout: 15000,
                headers: BROWSER_HEADERS,
                validateStatus: () => true
            })
            const first = res.data?.[0]
            if (first?.plainLyrics) {
                lyrics = first.plainLyrics
                foundTitle = first.trackName || title
                foundArtist = first.artistName || artist
            }
        } catch {}

        // 2. Fallback lyrics.ovh
        if (!lyrics && artist) {
            try {
                const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
                    timeout: 15000,
                    headers: BROWSER_HEADERS,
                    validateStatus: () => true
                })
                if (res.data?.lyrics) {
                    lyrics = res.data.lyrics
                    foundTitle = title
                    foundArtist = artist
                }
            } catch {}
        }

        if (!lyrics) return EliteProTech.sendMessage(m.chat, { text: `Lyrics not found for "${artist ? artist + ' - ' : ''}${title}".\nTry with artist name: *${global.prefix || '.'}lyrics Artist - Song*` }, { quoted: quotedMessage })

        const fullLyrics = lyrics.trim()
        const chunks = chunkLyrics(fullLyrics, 3500)

        // Header with thumbnail like play.js
        const header = `*🎵 ${foundTitle}*\n*🎤 Artist:* ${foundArtist || 'Unknown'}\n*📄 Parts:* ${chunks.length}\n*🔥 Powered by PRODEV ZW*\n\n`

        // Send Part 1 with thumbnail
        const firstChunk = header + chunks[0]
        try {
            if (video?.thumbnail) {
                await EliteProTech.sendMessage(m.chat, { image: { url: video.thumbnail }, caption: firstChunk }, { quoted: quotedMessage })
            } else {
                await EliteProTech.sendMessage(m.chat, { text: firstChunk }, { quoted: quotedMessage })
            }
        } catch {
            await EliteProTech.sendMessage(m.chat, { text: firstChunk }, { quoted: quotedMessage })
        }

        // Send rest FULL - no cut
        for (let i = 1; i < chunks.length; i++) {
            const partText = `*🎵 ${foundTitle} - Part ${i + 1}/${chunks.length}*\n\n${chunks[i]}`
            await EliteProTech.sendMessage(m.chat, { text: partText }, { quoted: quotedMessage })
            await new Promise(r => setTimeout(r, 800)) // avoid spam block
        }

    } catch (error) {
        return EliteProTech.sendMessage(m.chat, { text: `Lyrics failed: ${apiError(error.response?.data, error.message || 'Unable to reach lyrics service.')}` }, { quoted: quotedMessage })
    }
}

handler.command = ['lyrics', 'lyric', 'lyr', 'lyricsdl']
handler.help = ['lyrics <song>']
handler.tags = ['download']

export default handler
