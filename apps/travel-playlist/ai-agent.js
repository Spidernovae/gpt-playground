const { registerHandler } = require('./mcp');

const moodTracks = {
  chill: ['Ocean Breeze', 'Sunset Dreams', 'Calm Waves'],
  energetic: ['City Lights', 'Adventure Beats', 'High Spirits'],
  romantic: ['Moonlit Walk', 'Love in Paris'],
};

registerHandler(async ({ mood, preferences }) => {
  let tracks = moodTracks[mood] || [];
  if (preferences) {
    tracks = tracks.filter((t) =>
      t.toLowerCase().includes(preferences.toLowerCase())
    );
  }
  return tracks;
});
