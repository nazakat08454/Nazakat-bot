const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: 'silent' }),
        browser: ['Nazakat-Bot', 'Chrome', '1.0']
    })

    if (!sock.authState.creds.registered) {
        const phoneNumber = '923111867503'
        const code = await sock.requestPairingCode(phoneNumber)
        console.log(`\n=====================================`)
        console.log(`  AAPKA PAIRING CODE: ${code}`)
        console.log(`=====================================`)
        console.log(` WhatsApp > Linked Devices > Link with phone number`)
    }

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') {
            console.log('✅ Bot Connected! Nazakat-Bot is Running! ❤️')
        }
    })
}
startBot()
