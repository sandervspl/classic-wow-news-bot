const fetch = require('node-fetch');
const Parser = require('rss-parser');
const pino = require('pino');
const parser = new Parser();

require('dotenv').config();

const logger = pino({
  prettyPrint: true,
});

let reportedNewsIds = [];

function isOldNews(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  
  return ((now - date) / 60e3) >= 120;
}

async function getFeed() {
  try {
    const now = new Date();
    const feed = await parser.parseURL('https://www.reddit.com/r/classicwow/.rss');

    if (!feed || !feed.items || feed.items.length === 0) return;

    feed.items.forEach(async (item) => {
      if (item.content && item.content.includes('us.forums.blizzard.com')) {
        let logChild = logger.child({ label: 'item' });
        logChild.info(item.title);

        // Check if we have already posted this news
        if (reportedNewsIds.includes(item.id)) {
          logger.error('Item already reported', reportedNewsIds);
          return;
        }

        // Check if is old news
        if (isOldNews(item.isoDate)) {
          logger.error('Item is too old');
          return;
        }


        // Get website URL
        const url = item.content.match(
          /https:\/\/us.forums.blizzard.com\/en\/wow\/[\d-\w/]+\/\d+/
        );

        logChild = logger.child({ label: 'forums url' });
        logChild.info(url);

        if (!url) {
          logger.error('No valid URL found', url);
          return;
        }

        // Search for publish date of Blizzard's article
        const isOldArticle = await fetch(url)
          .then((response) => response.text())
          .then((html) => {
            // Look for the article published date
            const publishDateRgx = /2019-[\d-]+T[\d:+]+/.exec(html);
            
            logChild = logger.child({ label: 'forum post date regex result' });
            logChild.info(publishDateRgx);

            if (publishDateRgx && publishDateRgx[0]) {
              // Check if is old news
              logChild = logger.child({ label: 'forum post date' });
              logChild.info(publishDateRgx[0]);

              if (isOldNews(publishDateRgx[0])) return true;
            } else {
              logger.error('No publish date found on forum post');
              // return true;
            }

            return false;
          })
          .catch((err) => {
            console.error(err);
          });

        if (isOldArticle) {
          logger.error('Forum post is too old');
          return;
        }


        // Add this news to reported news IDs
        reportedNewsIds.push(item.id);

        const body = {
          content: `️⚠️ @here Classic news from Blizzard! "${item.title}"`,
          embeds: [{
            title: 'Read full post',
            url: url[0],
          }],
        };

        logger.info(
          `[${now.toDateString()} ${now.getHours()}:${now.getMinutes()}]`,
          'NEW POST!',
          `"${item.title}"`,
        );
        logger.error(JSON.stringify(body, null, 2));

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
