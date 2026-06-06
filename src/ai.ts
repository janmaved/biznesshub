// AI live chat support using Groq Cloud API (server-side).

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function groqChat(apiKey: string, messages: ChatMsg[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.6,
      max_tokens: 500
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq error ${res.status}: ${t}`);
  }
  const data = await res.json<any>();
  return data?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not respond right now.';
}

export function buildStoreSystemPrompt(store: any, products: any[]): string {
  const menu = products
    .map((p) => `- ${p.name} (${store.currency || 'INR'} ${p.sale_price || p.price})${p.description ? ': ' + p.description : ''}`)
    .join('\n');
  return `You are a friendly, helpful customer-support assistant for "${store.name}", a ${store.category} business.
About: ${store.about || ''}
Contact: phone ${store.phone || 'N/A'}, email ${store.email || 'N/A'}, address ${store.address || 'N/A'}.

Available products / menu:
${menu || 'No items listed yet.'}

Your job:
- Answer questions about products, prices, timings, location and services.
- Help customers decide and encourage them to place an order or send an enquiry.
- If the customer wants to be contacted, ask for their name and phone/email so the business can follow up.
- Be concise, warm and professional. Always reply in English unless the customer writes in another language.
- Never make up prices or items not in the list above.`;
}
