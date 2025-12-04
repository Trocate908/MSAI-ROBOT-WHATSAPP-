# MSAI Whats - WhatsApp Bot

## Overview
MSAI Whats is a WhatsApp bot built with Node.js and the Baileys library. It uses phone number pairing for authentication and responds to commands with professional formatting.

## Project Structure
```
├── src/
│   ├── index.js      # Main bot entry point with connection logic
│   ├── commands.js   # Command handler with case statement structure
│   └── config.js     # Bot configuration and message templates
├── auth_info_baileys/ # Stored credentials (auto-generated)
├── package.json      # Project dependencies
└── .gitignore        # Git ignore rules
```

## Environment Variables
- `PHONE_NUMBER` - Your WhatsApp phone number (format: countrycode + number, e.g., 1234567890)

## Commands
All commands start with `!` prefix:
- `!help` - Show all available commands
- `!ping` - Check bot response time
- `!info` - Get bot information
- `!menu` - Display the main menu
- `!about` - Learn about this bot
- `!owner` - Get owner contact information
- `!time` - Get current date and time
- `!sticker` - Sticker creation info

## How It Works
1. Bot starts and requests pairing code using PHONE_NUMBER
2. User enters the 8-digit pairing code in WhatsApp
3. Credentials are saved to `auth_info_baileys/` folder
4. Bot sends success message to user's inbox
5. Bot listens for messages and responds to commands

## Running the Bot
```bash
npm start
```

## Recent Changes
- December 2024: Initial bot setup with Baileys integration
- Implemented pairing code authentication
- Added command handler with case statement structure
- Added professional response formatting

## Technical Details
- Runtime: Node.js 20
- WhatsApp Library: @whiskeysockets/baileys
- Logging: pino (silent mode for clean output)
- Authentication: Multi-file auth state persistence
