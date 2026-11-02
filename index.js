const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')
const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Nazakat Easy Bot is Online ❤️'))
app.listen(process.env.PORT || 3000)

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
            console.log('✅ Connect ho gaya Jana! ❤️')
        }
    })

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0]
        if(!msg.message) return
        if(msg.key.fromMe) return
        
        const from = msg.key.remoteJid
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        
        if(text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello') {
            await sock.sendMessage(from, { text: 'Hello Jana! ❤️ Main online hun, Easy Bot chal raha hai!' })
        }
    })
}
startBot()
