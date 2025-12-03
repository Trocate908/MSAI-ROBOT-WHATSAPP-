const makeWASocket = require("@whiskeysockets/baileys").default;
const {
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
require("dotenv").config();

async function connectBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session'); 
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    // 🔥 Generate Pairing Code
    if (!sock.authState?.creds?.registered) {
        let code = await sock.requestPairingCode(process.env.PHONE_NUMBER);
        console.log("\n🔐 Your WhatsApp Pairing Code:");
        console.log("======================================");
        console.log("  📱  " + code);
        console.log("======================================\n");
        console.log("Go to: Linked Devices → Link with Code\n");
    }

    // 🔄 Auto reconnect if connection drops
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "open") console.log("🟢 Bot Connected Successfully!");
        if (connection === "close") {
            console.log("🔴 Connection Closed. Reconnecting...");
            connectBot();
        }
    });

    return sock;
}

module.exports = connectBot; 
