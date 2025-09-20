import express from 'express';
import cors from 'cors';
import { simulateReadableStream } from 'ai';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // This is where React app runs
  credentials: true
}));

app.get('/', (_, res) => {
  res.send(`Hello World!`);
});

app.post('/api/chat/test', async (_, res) => {
  // Set SSE headers
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

  // Pipe the stream to the response
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