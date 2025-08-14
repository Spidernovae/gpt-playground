const express = require('express');
const { sendMessage } = require('./mcp');

// Initialize AI agent handler
require('./ai-agent');

async function fetchMood(destination) {
  const res = await fetch(
    `http://localhost:5000/mood/${encodeURIComponent(destination)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.mood;
}

async function fetchSpotifyTracks(mood) {
  const token = process.env.SPOTIFY_TOKEN;
  if (!token) return [];
  try {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=track&limit=3`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return (data.tracks?.items || []).map((t) => t.name);
  } catch (err) {
    console.error('Spotify fetch failed', err);
    return [];
  }
}

const app = express();

app.get('/playlist', async (req, res) => {
  const { destination, preferences } = req.query;
  if (!destination) {
    return res.status(400).json({ error: 'destination is required' });
  }
  const mood = await fetchMood(destination);
  if (!mood) {
    return res.status(404).json({ error: 'Unknown destination' });
  }
  let tracks = await sendMessage({ mood, preferences });
  const spotifyTracks = await fetchSpotifyTracks(mood);
  if (spotifyTracks.length) {
    tracks = [...new Set([...spotifyTracks, ...tracks])];
  }
  res.json({ destination, mood, tracks });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Music service listening on port ${port}`);
});
