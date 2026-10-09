import express from 'express';
import cors from 'cors';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const CLIENT_ID = 'ae49228b53ac40d482020c2043ca2b13';
const CLIENT_SECRET = 'ad68430885824151b0ad5af28c246312';

// Proxy Spotify token
app.post('/spotify/token', async (req, res) => {
  try {
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const resp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const text = await resp.text();
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (e) {
      console.error('Failed to parse JSON. Raw response:', text);
      res.status(500).send(text);
    }
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).send(err.message);
  }
});

// Proxy Spotify search
app.get('/spotify/search', async (req, res) => {
  const token = req.headers['x-spotify-token'];
  const resp = await fetch(
    `https://api.spotify.com/v1/search?${new URLSearchParams(req.query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  res.json(data);
});

// Proxy Spotify playlist (trending)
app.get('/spotify/playlist/:id/tracks', async (req, res) => {
  const token = req.headers['x-spotify-token'];
  const resp = await fetch(
    `https://api.spotify.com/v1/playlists/${req.params.id}/tracks?limit=30`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await resp.json();
  res.json(data);
});

app.listen(3001, () => console.log('PLAY proxy server running on http://localhost:3001'));
