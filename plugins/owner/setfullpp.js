import {Jimp} from 'jimp'

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

let handler = async (m, { EliteProTech, text = '' }) => {
    const ownerNumber = '263788279395' // <-- YOUR NUMBER
    if (m.sender.split('@')[0] !== ownerNumber) {
        return EliteProTech.sendMessage(m.chat, { text: '❌ Only my owner can change my profile picture.' }, { quoted: quotedMessage })
    }

    let buffer = null
    try {
        if (m.quoted && /image/.test(m.quoted.mimetype || '')) {
            buffer = await EliteProTech.downloadMediaMessage(m.quoted)
        } else if (m.msg && /image/.test(m.msg.mimetype || '')) {
            buffer = await EliteProTech.downloadMediaMessage(m)
        } else if (text.trim().startsWith('http')) {
            const res = await fetch(text.trim())
            buffer = Buffer.from(await res.arrayBuffer())
        }
    } catch (e) {
        return EliteProTech.sendMessage(m.chat, { text: `❌ Failed to download image: ${e.message}` }, { quoted: quotedMessage })
    }

    if (!buffer) {
        return EliteProTech.sendMessage(m.chat, {
            text: `*Usage:* Reply to an image with *${global.prefix || '.'}setfullpp*\n\n*Or send image with caption:*\n${global.prefix || '.'}setfullpp`
        }, { quoted: quotedMessage })
    }

    await EliteProTech.sendMessage(m.chat, { text: '⏳ Setting full PP without cropping...' }, { quoted: quotedMessage })

    try {
        const original = await Jimp.read(buffer)
        const origW = original.bitmap.width
        const origH = original.bitmap.height

        // 1. Blurred background 640x640 (cover)
        const bg = original.clone().cover(640, 640).blur(25)

        // 2. Full image fitted inside 640x640 (contain - NO CROP)
        const fg = original.clone().contain(640, 640)

        // 3. Put full image on top of blurred bg
        bg.composite(fg, 0, 0)

        const final = await bg.getBufferAsync(Jimp.MIME_JPEG)

        await EliteProTech.updateProfilePicture(EliteProTech.user.id, final)

        await EliteProTech.sendMessage(m.chat, {
            text: `✅ *Full PP Set!*\n\n*Original:* ${origW}x${origH}\n*Final:* 640x640 (no crop)\n*Mode:* Blurred background fill\n\nNo cropping!`,
            image: final
        }, { quoted: quotedMessage })

    } catch (e) {
        return EliteProTech.sendMessage(m.chat, { text: `❌ Failed to set PP: ${e.message}` }, { quoted: quotedMessage })
    }
}

handler.command = ['setfullpp', 'fullpp', 'setppfull']
handler.help = ['setfullpp (reply to image)']
handler.tags = ['owner']
handler.owner = true

export default handler
