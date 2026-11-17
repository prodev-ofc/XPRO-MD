import fs from 'fs'
import path from 'path'
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const SETTINGS_PATH = path.join(process.cwd(), 'database', 'settings.json')

function readSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) } catch { return {} }
}
function writeSettings(data) {
    try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2)) } catch {}
}

async function setMode(EliteProTech, m, choice) {
    global.botMode = choice
    const settings = readSettings()
    settings.mode = choice
    writeSettings(settings)
    await EliteProTech.sendMessage(m.chat, {
        text: `✅ Bot mode set to *${choice.toUpperCase()}*.${choice === 'self' ? ' Only the owner can use commands now.' : ' Anyone can use commands now.'}`
    }, { quoted: m })
    await sendModeButtons(EliteProTech, m)
}

async function sendModeButtons(EliteProTech, m) {
    const prefix = global.prefix || '.'
    const current = global.botMode || 'public'
    const text = `⚙️ *BOT MODE*\n\n*Current Mode:* ${current === 'self' ? '🔒 SELF' : '🌍 PUBLIC'}\n\n${current === 'self' ? 'Only owner can use commands now.' : 'Anyone can use commands now.'}\n\n👇 Tap a button to change mode:`

    const content = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({ text }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: `ᴘᴏᴡᴇʀᴇᴅ ʙʏ xᴘʀᴏ-ᴛᴇᴄʜ©` }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        title: `⚙️ XPRO-MD MODE`,
                        subtitle: `BY PRODEV ZW`,
                        hasMediaAttachment: false
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            // FIX: display_text MUST be the command, because WhatsApp sends back display_text, not id
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `${prefix}mode self`, id: `${prefix}mode self` }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: `${prefix}mode public`, id: `${prefix}mode public` }) }
                        ]
                    })
                })
            }
        }
    }, { quoted: m })

    await EliteProTech.relayMessage(m.chat, content.message, {
        messageId: content.key.id,
        additionalNodes: [{
            tag: 'biz', attrs: {},
            content: [{
                tag: 'interactive', attrs: { type: 'native_flow', v: '1' },
                content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }]
            }]
        }]
    })
}

let handler = async (m, { EliteProTech, args }) => {
    const choice = args[0]?.toLowerCase()
    if (!choice) return await sendModeButtons(EliteProTech, m)
    if (choice !== 'self' && choice !== 'public') {
        await m.reply(`Invalid mode. Usage: ${global.prefix || '.'}mode self | ${global.prefix || '.'}mode public`)
        return await sendModeButtons(EliteProTech, m)
    }
    await setMode(EliteProTech, m, choice)
}

handler.command = ['mode']
handler.owner = true
export default handler
