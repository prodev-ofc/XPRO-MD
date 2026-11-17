// PRODEV XMD - Alive / Bot Status

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

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

let handler = async (m, { EliteProTech }) => {
    const uptime = formatUptime(process.uptime())
    const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const totalMem = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)
    const platform = process.platform
    const nodeVer = process.version
    const date = new Date().toLocaleString('en-ZW', { timeZone: 'Africa/Harare', dateStyle: 'medium', timeStyle: 'short' })

    const caption = `╭─── *X𝐏𝐑𝐎-𝐌𝐃* ───╮
│
│ ✅ *Status:* ONLINE
│ 👑 *Owner:* PRODEV ZW
│ ⏰ *Uptime:* ${uptime}
│ 📅 *Date:* ${date}
│
│ ⚙️ *System:*
│ • Platform: ${platform}
│ • Node: ${nodeVer}
│ • RAM: ${usedMem}MB / ${totalMem}GB
│ • Prefix: ${global.prefix || '.'}
│
│ 🔥 *Commands:*
│ • ${global.prefix || '.'}menu - Show all commands
│ 
│ 💬 *Bot is alive and ready!*
│
╰─────────────────╯
> *𝐏𝐑𝐎𝐃𝐄𝐕 𝐙𝐖 - POWERED BY XPRO MD BOT*`

    // Try send with image if you have one, else text only
    const imageUrl = global.botPic || 'https://i.ibb.co/pvydWrbf/image-1794823564782.jpg' // change to your logo

    try {
        await EliteProTech.sendMessage(m.chat, { image: { url: imageUrl }, caption }, { quoted: quotedMessage })
    } catch {
        await EliteProTech.sendMessage(m.chat, { text: caption }, { quoted: quotedMessage })
    }
}

handler.command = ['alive', 'bot', 'online']
handler.help = ['alive']
handler.tags = ['tools']

export default handler
