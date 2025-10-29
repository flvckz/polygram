function setupBotCallbacks(bot) {
  // Handle callback queries from inline keyboards
  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    try {
      switch (data) {
        case 'enter_wallet':
          await handleEnterWallet(bot, chatId, messageId);
          break;
          
        case 'wallet_help':
          await handleWalletHelp(bot, chatId, messageId);
          break;
          
        case 'back_to_connect':
          await handleBackToConnect(bot, chatId, messageId);
          break;
          
        default:
          console.log('Unknown callback data:', data);
      }
      
      // Answer the callback query to remove loading state
      bot.answerCallbackQuery(callbackQuery.id);
      
    } catch (error) {
      console.error('Error handling callback query:', error);
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'An error occurred. Please try again.',
        show_alert: true
      });
    }
  });
}

async function handleEnterWallet(bot, chatId, messageId) {
  const message = `
📝 *Enter Your Wallet Address*

Please send me your Ethereum/Polygon wallet address.

*Format:* 0x followed by 40 hexadecimal characters
*Example:* 0x742d35Cc6634C0532925a3b8D4C9db96590c6C87

⚠️ *Important:*
• Only send your PUBLIC wallet address
• Never share private keys or seed phrases
• Make sure it's the address you use with Polymarket

Just type or paste your wallet address in the next message.
  `;
  
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Back to Connect Options', callback_data: 'back_to_connect' }]
      ]
    }
  };
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    ...options
  });
}

async function handleWalletHelp(bot, chatId, messageId) {
  const message = `
❓ *What is my wallet address?*

Your wallet address is your public Ethereum/Polygon address that you use with Polymarket.

*Where to find it:*

🦊 *MetaMask:*
1. Open MetaMask extension
2. Click on your account name at the top
3. Your address will be displayed (starts with 0x)
4. Click to copy

🔗 *Other wallets:*
• Look for "Receive" or "Account" section
• Your address should start with 0x
• It's safe to share (it's public information)

💡 *On Polymarket:*
• Go to your profile/account section
• Your connected wallet address should be visible

*Example format:*
0x742d35Cc6634C0532925a3b8D4C9db96590c6C87

Remember: This is your PUBLIC address, not your private key!
  `;
  
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 I found my address', callback_data: 'enter_wallet' }],
        [{ text: '🔙 Back to Connect Options', callback_data: 'back_to_connect' }]
      ]
    }
  };
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    ...options
  });
}

async function handleBackToConnect(bot, chatId, messageId) {
  const message = `
🔗 *Connect Your Polymarket Wallet*

To connect your wallet, I need your wallet address.

*Option 1: Send your wallet address*
Simply send me your Ethereum/Polygon wallet address that you use with Polymarket.

*Option 2: Use inline keyboard*
Click the button below to enter your wallet address.

⚠️ *Security Note:*
• Only your public wallet address is needed
• Never share your private keys or seed phrase
• This bot only reads public blockchain data
  `;
  
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 Enter Wallet Address', callback_data: 'enter_wallet' }],
        [{ text: '❓ What is my wallet address?', callback_data: 'wallet_help' }]
      ]
    }
  };
  
  await bot.editMessageText(message, {
    chat_id: chatId,
    message_id: messageId,
    ...options
  });
}

module.exports = { setupBotCallbacks };