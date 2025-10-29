require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import bot handlers
const { setupBotCommands } = require('./bot/commands');
const { setupBotCallbacks } = require('./bot/callbacks');
const polymarketService = require('./services/polymarketService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Polygram Bot'
  });
});

// Setup bot commands and callbacks
setupBotCommands(bot);
setupBotCallbacks(bot);

// Error handling for bot
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Polygram Bot server running on port ${PORT}`);
  console.log(`🤖 Telegram Bot is active and listening for messages`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});