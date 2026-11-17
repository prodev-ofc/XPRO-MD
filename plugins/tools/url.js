

import fs from 'fs'
import { ImgBB, uploadToEliteProTechUrl, uploadToEliteTempUrl } from '../../lib/uploader.js'

const uploaders = {
    'eliteprotech-url': uploadToEliteProTechUrl,
    imgbb: ImgBB,
    tempurl: uploadToEliteTempUrl
}

const isMedia = (target) => {
    if (!target) return false

    const type = target.mtype || target.type || ''
    const mime = target.mimetype || target.msg?.mimetype || ''

    return (
        /image|video|audio|document|sticker/i.test(type) ||
        /^(image|video|audio|application|text)\//i.test(mime)
    )
}

const handler = async (m, { args }) => {
    const service = args[0]?.toLowerCase()
    const upload = uploaders[service]

    if (!upload) {
        return m.reply(
            `*HOW TO USE URL UPLOADER*

Attach media with caption:
.url imgbb

Or reply to media:
.url imgbb

*Available services:*
• imgbb
• tempurl
• eliteprotech-url

Supports images, videos, audio, documents, stickers and files.`
        )
    }

    // Supports both caption commands and replies to media
    const target = m.quoted || m

    if (!isMedia(target)) {
        return m.reply(
            '⚠️ Please attach a file with `.url ' + service +
            '` in its caption, or reply to a media/file message with the command.'
        )
    }

    let file

    try {
        await m.reply('⏳ Uploading your file...')

        file = await target.download(true)

        if (!file || typeof file !== 'string') {
            throw new Error('Could not download the media file.')
        }

        if (!fs.existsSync(file)) {
            throw new Error('Downloaded file was not found.')
        }

        const url = await upload(file)

        if (!url || typeof url !== 'string') {
            throw new Error('Uploader did not return a valid URL.')
        }

        await m.reply(
            `✅ *UPLOAD SUCCESSFUL*

🔗 ${url}

> *XPRO-MD* _Powered by PRODEV ZW_*`
        )

    } catch (error) {
        console.error('[URL UPLOADER]', error)

        await m.reply(
            `❌ *UPLOAD FAILED*

${error.message || String(error)}`
        )

    } finally {
        if (file && typeof file === 'string' && fs.existsSync(file)) {
            try {
                fs.unlinkSync(file)
            } catch (error) {
                console.error('File cleanup failed:', error)
            }
        }
    }
}

handler.command = ['url', 'tourl']

export default handler

