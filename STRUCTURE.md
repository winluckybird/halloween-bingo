# Search discovery configuration

Production origin: https://halloween-bingo-bkg.pages.dev

The site has one indexable HTML page:

| URL | Purpose |
| --- | --- |
| https://halloween-bingo-bkg.pages.dev/ | Halloween bingo generator, printable resources, instructions, and FAQs |

`dist/sitemap.xml` contains this single canonical HTTPS URL. Section fragments such as `#generator` belong to the same page. Generated cards and static artwork are resources rather than separate HTML pages.

`dist/robots.txt` permits crawling and declares the sitemap's absolute URL. The homepage includes a matching canonical link.

`dist/google2d1dd99d57463bc5.html` is the Google Search Console ownership verification file supplied by the site owner. Keep this file published after verification.

When moving to a custom domain, update the homepage canonical, sitemap URL, robots sitemap declaration, and this document together. Add and verify the new property in Search Console and Bing Webmaster Tools.
