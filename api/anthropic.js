// Forte Compass — server-side AI proxy.
// Holds the Anthropic key server-side; the browser never sees it.
// Reached at /api/anthropic on Vercel. Falls through gracefully: if no key is set,
// the client uses its built-in heuristic engine instead.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    res.status(503).json({ error: 'ai_not_configured' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const { system, messages, max_tokens } = body || {}
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: max_tokens || 1024,
        system: system || undefined,
        messages: messages || [],
      }),
    })
    const data = await r.json()
    const text = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
      : ''
    res.status(r.ok ? 200 : r.status).json({ text, raw: data })
  } catch (e) {
    res.status(502).json({ error: 'upstream_failed', detail: String(e) })
  }
}
