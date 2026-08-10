import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai/ai-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], context = {}, conversationId } = body;

    const userMessageObj = messages[messages.length - 1];
    const userMessage = userMessageObj?.content || '';

    if (!userMessage.trim()) {
      return NextResponse.json(
        { error: 'User message cannot be empty' },
        { status: 400 }
      );
    }

    const { message, citations, provider } = await AIService.generateResponse(
      userMessage,
      messages,
      context
    );

    return NextResponse.json({
      message,
      citations,
      provider,
      conversationId: conversationId || crypto.randomUUID(),
    });
  } catch (error: unknown) {
    console.error('Error in /api/copilot route:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'AI service is temporarily unavailable. Please try again.';

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 503 }
    );
  }
}
