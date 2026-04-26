// Vercel serverless function — POST /api/subscribe
// Set MAILCHIMP_API_KEY in Vercel project environment variables

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = 'us21';
  const listId = '08f7c7541f'; // Nieuwsbrief audience

  if (!apiKey) {
    return res.status(503).json({ error: 'Not configured' });
  }

  const auth = Buffer.from(`anystring:${apiKey}`).toString('base64');

  try {
    const mcRes = await fetch(
      `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          tags: ['website-signup'],
        }),
      }
    );

    if (mcRes.status === 400) {
      const data = await mcRes.json();
      if (data.title === 'Member Exists') {
        return res.status(200).json({ ok: true, already: true });
      }
      return res.status(400).json({ error: data.detail || 'Subscribe failed' });
    }

    if (!mcRes.ok) {
      return res.status(500).json({ error: 'Subscribe failed' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
};
