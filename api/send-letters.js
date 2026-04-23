const SUPABASE_URL = 'https://pydbaxxskltosvauciey.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZGJheHhza2x0b3N2YXVjaWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODI4ODQsImV4cCI6MjA5MjQ1ODg4NH0.j3OeXJuEykZdRCBBiCovmZBsfl6zTQj10UYmbAgB35g';
const RESEND_KEY = 're_PUKo4EET_EspNhRki6LEbQZpUooTpZSUP';

export default async function handler(req, res) {
  const today = new Date().toISOString().split('T')[0];

  const listRes = await fetch(
    `${SUPABASE_URL}/rest/v1/letters?deliver_at=eq.${today}&sent=eq.false&select=*`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  const letters = await listRes.json();

  if (!letters.length) {
    return res.status(200).json({ message: 'No letters to deliver today.' });
  }

  let delivered = 0;

  for (const letter of letters) {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Shepherd <onboarding@resend.dev>',
        to: letter.email,
        subject: 'Your letter from the past has arrived 🐾',
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;background:#faf6ee;padding:48px 40px;color:#2c2416;">
            <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a8906a;margin-bottom:32px;">Shepherd — Letters carried across time</p>
            <h1 style="font-size:26px;font-weight:400;margin-bottom:8px;color:#2c2416;">Your letter has arrived.</h1>
            <p style="font-size:14px;color:#a8906a;font-style:italic;margin-bottom:40px;">Written on ${new Date(letter.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })} — delivered today after its long journey.</p>
            <div style="border-left:2px solid #e8dcc4;padding:24px 28px;background:#f5edd8;margin-bottom:40px;white-space:pre-wrap;font-size:16px;line-height:1.9;color:#2c2416;">${letter.letter_text}</div>
            <p style="font-size:13px;color:#a8906a;font-style:italic;">The dog rests now. He made it. 🐾</p>
            <hr style="border:none;border-top:1px solid #e8dcc4;margin:32px 0;" />
            <p style="font-size:11px;color:#a8906a;">Shepherd &nbsp;·&nbsp; <a href="https://shepherd.vercel.app" style="color:#a8906a;">Write another letter</a></p>
          </div>
        `
      })
    });

    if (emailRes.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/letters?id=eq.${letter.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sent: true })
      });
      delivered++;
    }
  }

  return res.status(200).json({ message: `Delivered ${delivered} letter(s).` });
}
