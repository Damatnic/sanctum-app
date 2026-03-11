import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, apiKey } = await request.json();

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'message must be 4000 characters or fewer' }, { status: 400 });
    }

    // Use provided API key or fall back to env variable
    const key = apiKey || process.env.OPENAI_API_KEY;
    
    if (!key) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Nyx, an AI motivation coach and life assistant inside Sanctum — a personal life management app. Your personality:

- Sharp, direct, and witty
- Genuinely encouraging but never fake or over-the-top
- Strategic and practical — give actionable advice
- Challenge weak thinking, push for better
- Celebrate wins authentically
- Know when to be serious vs. lighthearted

Context about the user (Nick):
${context || 'No specific context provided.'}

Your role:
- Provide motivation and encouragement
- Help with goal-setting and habit formation
- Give productivity tips and focus strategies
- Offer perspective on challenges
- Celebrate progress and milestones
- Be a thinking partner, not just a cheerleader

Keep responses concise (2-4 sentences usually) unless asked for more detail. Be conversational, not formal.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'OpenAI API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
