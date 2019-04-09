var Parser = require('rss-parser');
var parser = new Parser();

setInterval(async () => {
  let feed = await parser.parseURL('https://www.reddit.com/r/classicwow/.rss');
  console.log('--- ' + feed.title + ' ---');

  feed.items.forEach((item) => {
    if (item.content.includes('us.forums.blizzard.com')) {
      const url = item.content.match(
        /https:\/\/us.forums.blizzard.com\/en\/wow\/[t/a-z-]+\d+/
      );

      if (url) {
        console.log(item.id);
        console.log(item.title);
        console.log(url[0]);
      }
    }
  });
}, 30000);
