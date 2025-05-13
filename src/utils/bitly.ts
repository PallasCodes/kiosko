export async function shortenUrl(url: string): Promise<string> {
  const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.BITLY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ long_url: url }),
  })

  if (!response.ok) {
    throw new Error('Error al acortar la URL')
  }

  const data = await response.json()
  return data.link
}
