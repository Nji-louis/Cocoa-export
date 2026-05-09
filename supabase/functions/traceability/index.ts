export default async function handler(req: Request) {
  return new Response(JSON.stringify({ ok: true, msg: 'traceability function placeholder' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
