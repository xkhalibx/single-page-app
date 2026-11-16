# Signal — Cyber News Dashboard

A no-build, single-page dashboard for current Hacker News technology stories. It uses the public Hacker News API and includes a validated keyword search form, live filtering, refresh, story scores, authors, and links to the original stories and discussions.

## Run locally

Open `index.html` in a browser, or serve this folder with a static web server:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. The dashboard fetches stories from the Hacker News API, so an internet connection is required.