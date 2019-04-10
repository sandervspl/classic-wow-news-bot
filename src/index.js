const fetch = require('node-fetch');
const Parser = require('rss-parser');
const parser = new Parser();

let lastNewsId = '';

async function getFeed() {
  try {
    const now = new Date();
    const feed = await parser.parseURL('https://www.reddit.com/r/classicwow/.rss');

    feed.items.forEach(item => {
      if (item.content.includes('us.forums.blizzard.com')) {
        // Check if we have already posted this news
        if (item.id === lastNewsId) return;
        
        // Check if is old news
        let timeDiff = now - new Date(item.isoDate);
        timeDiff /= 60e3; // Convert to minutes

        if (timeDiff >= 60) return;

        // Get website URL
        const url = item.content.match(
          /https:\/\/us.forums.blizzard.com\/en\/wow\/[t/a-z-]+\d+/
        );

        // Get website image URL
        const imgUrl = item.content.match(
          /<img src="(http[s]*:\/\/[a-z]*.*.(?:jpe?g|png|gif))/
        );

        if (!url) return;

        // Set this news as latest news
        lastNewsId = item.id;

        const body = {
          content: ':warning: @here Classic news from Blizzard!',
          embeds: [{
            title: item.title,
            url: url[0],
          }],
        };

        if (imgUrl && imgUrl[1] && imgUrl[1].match(/(jpe?g|png|gif)/)) {
          body.embeds.push({
            image: {
              url: imgUrl[1],
            },
          });
        }

        console.info(
          `[${now.toDateString()} ${now.getHours()}:${now.getMinutes()}]`,
          'NEW POST!',
          `"${item.title}"`,
        );
        console.info(JSON.stringify(body, null, 2));

        fetch(
          'https://discordapp.com/api/webhooks/561859993587154954/to8nVsewGm94K431aKCw-bI-dtfxAorby8M5xAyaBfu3p5st0inY6OxGgQXKu7KBg9lH',
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
