const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const express = require('express')
const qrcode = require('qrcode-terminal')
const app = express()

// Render ko zinda rakhne ke liye server
app.get('/', (req, res) => res.send('Nazakat-Bot is Running! ❤️'))
const PORT = process.env.PORT || 10000
app.listen(PORT, () => console.log(`Server running on ${PORT}`))

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['Nazakat-Bot', 'Chrome', '1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update
    if(qr){
      console.log('=== SCAN THIS QR IN WHATSAPP ===')
      qrcode.generate(qr, { small: true })
    }
    if(connection === 'close'){
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut)
      console.log('Connection closed, reconnecting...', shouldReconnect)
      if(shouldReconnect) startBot()
    } else if(connection === 'open'){
      console.log('✅ Nazakat-Bot Connected Jana! ❤️')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if(!m.message) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
    if(text.toLowerCase() === 'hi' || text.toLowerCase() === 'hello'){
      await sock.sendMessage(m.key.remoteJid, { text: 'Hi Jana! I am Nazakat-Bot ❤️ Bot is online!' })
    }
  })
}

startBot()
