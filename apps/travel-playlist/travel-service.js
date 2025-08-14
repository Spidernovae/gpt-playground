const express = require('express');
const app = express();

const destinations = [
  { name: 'Hawaii', mood: 'chill' },
  { name: 'New York', mood: 'energetic' },
  { name: 'Paris', mood: 'romantic' },
];

app.get('/destinations', (req, res) => {
  res.json(destinations.map((d) => d.name));
});

app.get('/mood/:destination', (req, res) => {
  const dest = destinations.find(
    (d) => d.name.toLowerCase() === req.params.destination.toLowerCase()
  );
  if (dest) {
    res.json({ mood: dest.mood });
  } else {
    res.status(404).json({ error: 'Destination not found' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Travel service listening on port ${port}`);
});
