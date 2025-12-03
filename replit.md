# MSI XMD Bot - WhatsApp Bot

## Overview
MSI XMD is a WhatsApp bot built with Baileys and Node.js. It supports commands with the "." prefix and is designed for easy deployment on Render.

## Features
- Command-based bot with "." prefix
- Automatic pairing code generation (no QR codes)
- Session persistence via Base64 encoding
- Deployable on Render with environment variables
- Extensible command system

## Commands
| Command | Aliases | Description |
|---------|---------|-------------|
| .menu | .help, .commands | Show all available commands |
| .ping | .p | Check bot response time |
| .alive | .bot, .test | Check if bot is online |
| .info | .botinfo, .status | Show system information |
| .sticker | .s, .stiker | Convert image to sticker |

## Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| PHONE_NUMBER | WhatsApp number with country code (e.g., +1234567890) | Yes (for pairing) |
| WHATSAPP_SESSION | Base64 encoded session string | No (auto-generated after pairing) |

## How to Deploy on Render

### Step 1: First-time Pairing (on Replit)
1. Set `PHONE_NUMBER` environment variable to your WhatsApp number
2. Run the bot with `npm start`
3. Enter the 6-digit pairing code in WhatsApp
4. Wait 2 minutes for session sync
5. Copy the Base64 session string that appears

### Step 2: Deploy to Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set environment variables:
   - `WHATSAPP_SESSION`: Paste the Base64 session from Step 1
4. Deploy!

## Project Structure
```
├── index.js                 # Entry point
├── src/
│   ├── connection.js        # WhatsApp connection & pairing
│   ├── handler.js           # Message & command handler
│   └── commands/
│       ├── index.js         # Command registry
│       ├── menu.js          # Menu command
│       ├── ping.js          # Ping command
│       ├── alive.js         # Alive command
│       ├── info.js          # Info command
│       └── sticker.js       # Sticker command
├── package.json
├── replit.md
└── .gitignore
```

## Adding New Commands
1. Create a new file in `src/commands/` (e.g., `mycommand.js`)
2. Export a command object with: name, aliases, description, category, execute
3. Import and add to the commandList in `src/commands/index.js`

## Technical Details
- Uses @whiskeysockets/baileys for WhatsApp Web API
- Session stored in `auth_info_baileys/` folder
- Sessions converted to Base64 for easy environment variable storage
- Auto-reconnection on connection loss

## Recent Changes
- December 2025: Full bot implementation with command system
