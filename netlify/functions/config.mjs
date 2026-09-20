export default async () => new Response(JSON.stringify({
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || ''
}), {
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});
