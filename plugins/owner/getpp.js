// PRODEV XMD - Get Profile Picture

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
    // Priority: 1. Mentioned user  2. Replied user  3. You
    let targetJid = m.sender

    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0]
    } else if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (text.trim()) {
        // If user typed a number: .getpp 26377...
        const num = text.replace(/[^0-9]/g, '')
        if (num.length >= 10) {
            targetJid = num.startsWith('263') ? `${num}@s.whatsapp.net` : `263${num.slice(-9)}@s.whatsapp.net`
        }
    }

    const name = targetJid.split('@')[0]
    const isYou = targetJid === m.sender

    try {
        const ppUrl = await EliteProTech.profilePictureUrl(targetJid, 'image')
        
        const caption = `*📸 Profile Picture*\n\n*User:* @${name}\n*JID:* ${targetJid}\n${isYou ? '*This is your DP*' : ''}\n\n> *𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖*`

        await EliteProTech.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption,
            mentions: [targetJid]
        }, { quoted: quotedMessage })

    } catch {
        await EliteProTech.sendMessage(m.chat, {
            text: `❌ No profile picture found for @${name}.\nThey might have no DP or have privacy on.`
        }, { quoted: quotedMessage })
    }
}

handler.command = ['getpp', 'pp', 'profilepic', 'getdp', 'dp']
handler.help = ['getpp [@user / reply]']
handler.tags = ['owner']

export default handler
