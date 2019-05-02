const fetch = require('node-fetch');
const Parser = require('rss-parser');
const parser = new Parser();

let lastNewsId = '';

async function getFeed() {
  try {
    const now = new Date();
    const feed = await parser.parseURL('https://www.reddit.com/r/classicwow/.rss');

    feed.items.forEach(async (item) => {
      if (item.content.includes('us.forums.blizzard.com')) {
        // Check if we have already posted this news
        if (item.id === lastNewsId) return;
        
        // Check if is old news
        let timeDiff = now - new Date(item.isoDate);
        timeDiff /= 60e3; // Convert to minutes

        if (timeDiff >= 60) return;


        // Get website URL
        const url = item.content.match(
          /https:\/\/us.forums.blizzard.com\/en\/wow\/[a-zA-Z-/]+\d+/
        );

        if (!url) return;


        // Use old Reddit to easily find current upvotes
        const oldRedditLink = item.link.replace('www', 'old');

        // Search for amount of upvotes
        let upvotes = await fetch(oldRedditLink)
          .then((response) => response.text())
          .then((html) => {
            // Look for element with class "score unvoted" and a title that includes the number
            // of upvotes
            const upvoteElement = /class="score unvoted" title="(?:\d+)/.exec(html);
            
            if (upvoteElement != null && upvoteElement.length > 0) {
              // Get the number of upvotes
              const str = upvoteElement[0].split('title="');
              
              if (str && str.length > 0) {
                // Get upvotes amount
                const postUpvotes = str[1];

                // Return the amount of upvotes
                if (postUpvotes) {
                  return Number(postUpvotes);
                }
              }
            }
          })
          .catch((err) => {
            console.error(err);
          });

        // Check for minimum upvote amount
        if (typeof upvotes === 'number' && upvotes < 20) return;


        // Set this news as latest news
        lastNewsId = item.id;

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
          `[⬆️ ${upvotes}]`,
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
