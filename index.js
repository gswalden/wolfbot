'use strict';

if (!process.env.TELEGRAM_TOKEN) throw new Error('Missing TELEGRAM_TOKEN');

const _ = require('lodash');
const Bot = require('node-telegram-bot')
const yahooFinance = require('yahoo-finance')
const parser = require('rss-parser')
const getUrls = require('get-urls')
const seenImgs = new Set();

function getDankMemes() {
  return new Promise((resolve, reject) => {
    parser.parseURL('https://www.reddit.com/r/dankmemes/.rss', function(err, parsed) {
      if (err) {
        return reject(err);
      }

      const urls = _(parsed.feed.entries)
        .map(entry => {
          return Array.from(getUrls(entry.content)).filter(url => /(jpe?g|png|gif)$/i.test(url)).pop();
        })
        .compact()
        .value();

      let img, i = 0;
      do {
        if (i++ > 20) return reject('No new images');
        img = _.sample(urls);
      } while (seenImgs.has(img));
      seenImgs.add(img);
      resolve(img);
    })
  });
}

function messageHandler(msg) {
  if (!msg.text) return;

  console.log(`Saw message: ${msg.text}`, msg);

  let match = msg.text.toUpperCase().match(/!QUOTE\s+([A-Z]+)/);
  if (match) {
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

  match = msg.text.toLowerCase().match(/pls\s*meme/);
  if (match) {
    return getDankMemes().then(img => {
      bot.sendMessage({
        chat_id: msg.chat.id,
        text: img
      })
    }).catch(err => {
      console.error(err);
      bot.sendMessage({
        chat_id: msg.chat.id,
        text: 'Oops, I failed'
      })
    });
  }
}

const bot = new Bot({
  token: process.env.TELEGRAM_TOKEN
}).on('message', messageHandler).start();
