let fetch = require('node-fetch');
let Parser = require('rss-parser');
let parser = new Parser();

let lastUpdateId = '';

async function getFeed() {
  let feed = await parser.parseURL('https://www.reddit.com/r/classicwow/.rss');
  console.log('--- ' + feed.title + ' ---');

  feed.items.forEach(item => {
    if (item.content.includes('us.forums.blizzard.com')) {
      console.log(1);
      if (item.id === lastUpdateId) return;

      const url = item.content.match(
        /https:\/\/us.forums.blizzard.com\/en\/wow\/[t/a-z-]+\d+/
      );

      console.log(2);
      if (!url) return;

      console.log(item.id);
      console.log(item.title);
      console.log(url[0]);

      fetch(
        'https://discordapp.com/api/webhooks/561859993587154954/to8nVsewGm94K431aKCw-bI-dtfxAorby8M5xAyaBfu3p5st0inY6OxGgQXKu7KBg9lH',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            content: ':warning: @here Classic news from Blizzard!',
            embeds: [
              { title: '{{EntryTitle}}', url: ' {{EntryUrl}}' },
              { image: { url: '{{EntryImageUrl}}' } },
            ],
          },
        }
      );
    }
  });
}

setInterval(getFeed, 30000);

getFeed();
