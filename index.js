'use strict';

if (!process.env.TELEGRAM_TOKEN) throw new Error('Missing TELEGRAM_TOKEN');

const Bot = require('node-telegram-bot')
const yahooFinance = require('yahoo-finance')

function messageHandler(msg) {
  if (!msg.text) return;

  const match = msg.text.toUpperCase().match(/!QUOTE\s+([A-Z]+)/);
  if (!match) return;

  return yahooFinance.snapshot({
    symbol: match[1],
    fields: ['l1', 'n']
  }).then(quote => {
    bot.sendMessage({
      chat_id: msg.chat.id,
      text: `${quote.name || quote.symbol}: $${quote.lastTradePriceOnly.toFixed(2)}`
    })
  })
}

const bot = new Bot({
  token: process.env.TELEGRAM_TOKEN
}).on('message', messageHandler).start();
