const fetch = require('node-fetch');
const Parser = require('rss-parser');
const parser = new Parser();

require('dotenv').config();

let reportedNewsIds = [];

function isOldNews(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  
  return ((now - date) / 60e3) >= 60;
}

async function getFeed() {
  try {
    const now = new Date();
    const feed = await parser.parseURL('https://www.reddit.com/r/classicwow/.rss');

    feed.items.forEach(async (item) => {
      if (item.content.includes('us.forums.blizzard.com')) {
        // Check if we have already posted this news
        if (reportedNewsIds.includes(item.id)) return;
        
        // Check if is old news
        if (isOldNews(item.isoDate)) return;


        // Get website URL
        const url = item.content.match(
          /https:\/\/us.forums.blizzard.com\/en\/wow\/.+\/\d+/
        );

        if (!url) return;


        // Search for publish date of Blizzard's article
        const isOldArticle = await fetch(url)
          .then((response) => response.text())
          .then((html) => {
            // Look for the article published date
            const publishDateRgx = /2019-[\d-]+T[\d:+]+/.exec(html);

            if (publishDateRgx && publishDateRgx[0]) {
              // Check if is old news
              if (isOldNews(publishDateRgx[0])) return true;
            }

            return false;
          })
          .catch((err) => {
            console.error(err);
          });

        if (isOldArticle) return;


        // Add this news to reported news IDs
        reportedNewsIds.push(item.id);

        const body = {
          content: `️⚠️ @here Classic news from Blizzard! "${item.title}"`,
          embeds: [{
            title: 'Read full post',
            url: url[0],
          }],
        };

        console.info(
          `[${now.toDateString()} ${now.getHours()}:${now.getMinutes()}]`,
          'NEW POST!',
          `"${item.title}"`,
        );
        console.info(JSON.stringify(body, null, 2));

        fetch(
          process.env.WEBHOOK_URI,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          },
        )
      }
    });
  } catch (err) {
    console.log(err);
  }
}

setInterval(getFeed, 30000);

getFeed();

console.log('[BOT] Classic news bot started.');
