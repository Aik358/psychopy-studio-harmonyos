export async function GET() {
  const data = await fetch('https://psychopy.org/plugins.json')
    .then(
        resp => resp.json()
    );


  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}