let handler = async (m, { EliteProTech }) => {
    const start = Date.now()

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

    const sent = await EliteProTech.sendMessage(m.chat, { text: 'Speed test..' }, { quoted: quotedMessage })
    const latency = Date.now() - start
    await EliteProTech.sendMessage(m.chat, {
        text: `*Pong!* \n\n *XPRO-MD* _LATENCY=> *${latency}ms*_`,
        edit: sent.key
    }, { quoted: quotedMessage })
}
handler.command = ['ping', 'speed']
export default handler
