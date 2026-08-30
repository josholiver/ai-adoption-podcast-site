// Pulls the latest videos from the channel's public YouTube RSS feed
// and writes them to data/episodes.json. No API key required.
//
// Run manually with:   node scripts/fetch-episodes.mjs
// Runs automatically via .github/workflows/update-episodes.yml

import { writeFile, readFile } from "node:fs/promises";

const CHANNEL_ID = "UCvhxwtr4EYjAI5Oct2zy4Kg"; // The AI Adoption Podcast
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const OUTPUT_PATH = new URL("../data/episodes.json", import.meta.url);

function extractAll(pattern, text) {
  return [...text.matchAll(pattern)].map((m) => m[1]);
}

function decodeEntities(str = "") {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function parseFeed(xml) {
  const entries = extractAll(/<entry>([\s\S]*?)<\/entry>/g, xml);

  return entries.map((entry) => {
    const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1] || null;
    const title = decodeEntities(
      (entry.match(/<media:title>(.*?)<\/media:title>/) || entry.match(/<title>(.*?)<\/title>/) || [])[1]
    );
    const description = decodeEntities(
      (entry.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || ""
    );
    const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1] || null;

    return {
      videoId,
      title,
      description: description.split("\n")[0].slice(0, 220),
      publishedAt: published ? published.slice(0, 10) : null,
      guestName: "",
      guestRole: "",
      duration: "",
      season: null
    };
  });
}

async function main() {
  const res = await fetch(FEED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "application/xml,text/xml,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      // Avoids the EU/region cookie-consent interstitial some Google
      // properties return instead of the feed for cookie-less requests.
      "Cookie": "CONSENT=YES+cb; SOCS=CAI"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch YouTube feed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();

  if (!xml.trim().startsWith("<?xml") && !xml.includes("<feed")) {
    console.error("Response did not look like the YouTube Atom feed. First 500 chars:");
    console.error(xml.slice(0, 500));
    throw new Error(
      "YouTube did not return the expected RSS/Atom feed (got HTML or an empty body instead). " +
      "See the logged snippet above for what was actually returned."
    );
  }

  const fetched = parseFeed(xml);

  if (fetched.length === 0) {
    throw new Error(
      "Fetched the feed successfully but parsed zero <entry> blocks from it — " +
      "the feed's structure may have changed. Inspect the raw feed content to debug."
    );
  }

  let existing = { episodes: [] };
  try {
    existing = JSON.parse(await readFile(OUTPUT_PATH, "utf-8"));
  } catch {
    // no existing file yet — that's fine
  }
  const byId = new Map((existing.episodes || []).map((e) => [e.videoId, e]));

  const merged = fetched.map((ep) => {
    const prev = byId.get(ep.videoId);
    return prev
      ? {
          ...ep,
          guestName: prev.guestName,
          guestRole: prev.guestRole,
          duration: prev.duration,
          season: prev.season ?? null,
          description: prev.description || ep.description
        }
      : ep;
  });

  const output = {
    channel: {
      name: "The AI Adoption Podcast",
      handle: "@aiadoption-conversations",
      channelId: CHANNEL_ID
    },
    updatedAt: new Date().toISOString(),
    episodes: merged
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${merged.length} episodes to data/episodes.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
