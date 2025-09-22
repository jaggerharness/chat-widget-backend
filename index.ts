import express from 'express';
import cors from 'cors';
import { convertToModelMessages, generateObject, simulateReadableStream, streamText, UIMessage } from 'ai';
import { google } from "@ai-sdk/google"
import { ServerResponse } from 'http';
import z from 'zod';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // This is where React app runs
  credentials: true
}));

app.use(express.json());

function isQuizRequest(messages: UIMessage[]) {
  return true;
}

function handleGenerateText(messages: UIMessage[], res: ServerResponse) {
  const result = streamText({
    model: google("models/gemini-2.0-flash"),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
  });

  result.pipeUIMessageStreamToResponse(res);
}

async function handleGenerateQuiz(messages: UIMessage[], res: ServerResponse) {
  const lastMessage = messages.at(-1);
  const result = await generateObject({
    model: google("models/gemini-2.0-flash"),
    schema: z.object({
      quiz: z.object({
        title: z.string().describe("The title of the quiz"),
        questions: z.array(
          z.object({
            question: z.string().describe("The quiz question"),
            options: z.array(z.string().describe("Multiple choice options - each question should have 4 options")),
            correctAnswer: z.string().describe("The correct multiple choice answer")
          })
        ).describe("Array of quiz questions - the quiz should contain 5 questions")
      })
    }),
    prompt: `
          Create a quiz based on the user's request: "${lastMessage}"

          The quiz should contain 5 multiple choice questins that are:
          - Clear and unambiguous
          - Appropriately challenging
          - Educational and informative
          - Include 4 options each with only one correct answer
        `,
  });

  console.log(JSON.stringify(result.object, null, 2));
}



app.post('/api/chat', async (req, res) => {
  const messages: UIMessage[] = req.body.messages;

  const isQuiz = isQuizRequest(messages);

  if (!isQuiz) {
    handleGenerateText(messages, res);
  }

  await handleGenerateQuiz(messages, res);
});

app.post('/api/chat/test', async (_, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Credentials': 'true',
    'x-vercel-ai-ui-message-stream': 'v1',
  });

  // Create the simulated stream
  const stream = simulateReadableStream({
    initialDelayInMs: 500,
    chunkDelayInMs: 500,
    chunks: [
      `data: {"type":"start","messageId":"msg-123"}\n\n`,
      `data: {"type":"text-start","id":"text-1"}\n\n`,
      `data: {"type":"text-delta","id":"text-1","delta":"This"}\n\n`,
      `data: {"type":"text-delta","id":"text-1","delta":" is an"}\n\n`,
      `data: {"type":"text-delta","id":"text-1","delta":" example."}\n\n`,
      `data: {"type":"text-end","id":"text-1"}\n\n`,
      `data: {"type":"finish"}\n\n`,
      `data: [DONE]\n\n`,
    ],
  });

  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      res.write(value);
    }
  } catch (error) {
    console.error('Stream error:', error);
  } finally {
    reader.releaseLock();
    res.end();
  }
});

app.listen(3000, () => {
  console.log(`🚀 Server ready at: http://localhost:3000`);
});

