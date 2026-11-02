const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')
const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Nazakat Super Bot Online Hai Jana ❤️'))
app.listen(process.env.PORT || 3000, () => console.log('Server Started'))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('✅ Super Bot Connect Ho Gaya Jana!')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if(!msg.message) return
        if(msg.key.fromMe) return
        
        const from = msg.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ''
        const sender = msg.key.participant || from

        // 1. AUTO ANTI-LINK SYSTEM - GROUPS KE LIYE
        if(isGroup && text.includes('https://')) {
            if(text.includes('chat.whatsapp.com') || text.includes('youtube.com') || text.includes('youtu.be')) {
                // Link mil gaya
                await sock.sendMessage(from, { delete: msg.key })
                await sock.sendMessage(from, { text: `⚠️ @${sender.split('@')[0]} لنک بھیجنا منع ہے جاناں!`, mentions: [sender] })
            }
        }

        // 2. MENU - SAB COMMANDS
        if(text.toLowerCase() === 'menu' || text.toLowerCase() === 'help') {
            let menuText = `
*❤️ NAZAKAT SUPER BOT MENU ❤️*

*گروپ کے فیچرز:*
.antlink on/off - لنک ڈیلیٹ سسٹم
.tagall - سب کو ٹیگ کرے
.hidetag - خفیہ ٹیگ
.welcome on/off

*میڈیا فیچرز:*
.sticker - تصویر کو سٹیکر بنائے
.toaudio - ویڈیو کو آڈیو بنائے
.tovideo - آڈیو کو ویڈیو بنائے
.play [گانے کا نام] - گانا ڈاؤنلوڈ

*اور بھی بہت کچھ... بس لکھو:*
hi - ہیلو بولے گا
            `
            await sock.sendMessage(from, { text: menuText })
        }

        // 3. STICKER BANANA
        if(text.toLowerCase() === '.sticker' || text.toLowerCase() === 'sticker') {
            if(msg.message.imageMessage) {
                await sock.sendMessage(from, { sticker: { url: msg.message.imageMessage.url } || msg.message.imageMessage })
            }
        }

        // 4. TAG ALL
        if(text.toLowerCase() === '.tagall') {
            if(isGroup) {
                const groupMeta = await sock.groupMetadata(from)
                const members = groupMeta.participants.map(p => p.id)
                let tagText = `📢 *سب کو ٹیگ جاناں کی طرف سے:*\n\n`
                for(let mem of members) { tagText += `@${mem.split('@')[0]} ` }
                await sock.sendMessage(from, { text: tagText, mentions: members })
            }
        }
        
        if(text.toLowerCase() === 'hi') {
            await sock.sendMessage(from, { text: 'جی جاناں! حکم کریں؟ menu لکھیں سب فیچرز دیکھنے کے لیے ❤️' })
        }
    })
}
startBot()
