import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WATERMARK = `> _✨XPRO-MD by 𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖_`
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp')
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

// Map user lang -> Google TTS lang
const LANG_MAP = {
  sh: 'sn', // Shona - user types sh, Google needs sn
  sn: 'sn', // Shona
  shona: 'sn',
  chishona: 'sn',
  ndebele: 'nd',
  nd: 'nd',
  zulu: 'zu',
  zu: 'zu',
  xhosa: 'xh',
  sotho: 'st',
}

function getQuotedText(m) {
  // Try all XPRO-MD / Baileys quoted formats
  if (m.quoted) {
    if (m.quoted.text) return m.quoted.text
    if (m.quoted.caption) return m.quoted.caption
    if (m.quoted.body) return m.quoted.body
    if (m.quoted.conversation) return m.quoted.conversation
    if (m.quoted.extendedTextMessage?.text) return m.quoted.extendedTextMessage.text
  }
  // Raw Baileys contextInfo fallback
  const ctx = m.message?.extendedTextMessage?.contextInfo || m.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo
  const q = ctx?.quotedMessage
  if (q) {
    return q.conversation || q.extendedTextMessage?.text || q.imageMessage?.caption || q.videoMessage?.caption || ""
  }
  return ""
}

function generateTTS(text, lang, filePath) {
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, lang)
    gtts.save(filePath, (err) => {
      if (err) return reject(err)
      resolve(filePath)
    })
  })
}

let handler = async (m, { EliteProTech, args }) => {
    let rawArgs = args
    if (!rawArgs || !rawArgs.length) {
        const body = m.text || m.body || ""
        rawArgs = body.trim().split(/\s+/).slice(1)
    }

    let language = 'en'
    let text = rawArgs.join(" ").trim()

    // .tts sh Hello / .tts sn Hello / .tts shona Hello
    if (rawArgs.length >= 1 && LANG_MAP[rawArgs[0].toLowerCase()]) {
        language = LANG_MAP[rawArgs[0].toLowerCase()]
        text = rawArgs.slice(1).join(" ").trim()
    } else if (rawArgs.length >= 2 && /^[a-z]{2}$/i.test(rawArgs[0])) {
        language = rawArgs[0].toLowerCase()
        text = rawArgs.slice(1).join(" ").trim()
    }

    // If no text, use replied message
    if (!text) {
        text = getQuotedText(m).trim()
        // If user did ".tts sh" replying, keep shona lang, text = quoted
        if (text && rawArgs.length === 1 && LANG_MAP[rawArgs[0].toLowerCase()]) {
            language = LANG_MAP[rawArgs[0].toLowerCase()]
        }
    }

    if (!text) {
      return await EliteProTech.sendMessage(m.chat, {
        text: `*TTS Usage:*\n.tts <text>\n.tts <lang> <text>\nReply to a message + .tts\nReply + .tts sh\n\nExamples:\n.tts Hello world\n.tts sh Mhoro shamwari, makadii?\n.tts sn Mhoro\n.tts fr Bonjour\n\nReply to any message:\n> .tts\n> .tts sh\n\nLangs: en, sh/sn (Shona), fr, es, de, ja, hi, zu, nd, etc\n\n${WATERMARK}`
      }, { quoted: m })
    }

    const fileName = `tts-${Date.now()}.mp3`
    const filePath = path.join(TEMP_DIR, fileName)

    try {
      await EliteProTech.sendMessage(m.chat, { react: { text: "🔊", key: m.key } })
      await generateTTS(text, language, filePath)
      await EliteProTech.sendMessage(m.chat, {
        audio: { url: filePath },
        mimetype: 'audio/mpeg',
        ptt: false
      }, { quoted: m })
      await EliteProTech.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
      try { fs.unlinkSync(filePath) } catch {}
    } catch (e) {
      console.log('[tts] error:', e.message)
      // If Shona fails on gTTS, fallback to English so it still speaks
      if (language === 'sn') {
        try {
          await generateTTS(text, 'en', filePath)
          await EliteProTech.sendMessage(m.chat, { audio: { url: filePath }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m })
          try { fs.unlinkSync(filePath) } catch {}
          return
        } catch {}
      }
      await EliteProTech.sendMessage(m.chat, { text: `❌ Error generating TTS: ${e.message}\n\n${WATERMARK}` }, { quoted: m })
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath) } catch {}
    }
}

handler.command = ['tts', 'say', 'gtts', 'speak']
handler.tags = ['tools']
handler.help = ['tts <text>']
export default handler
