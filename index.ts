import express from "express";
import cors from "cors";
import {
  convertToModelMessages,
  simulateReadableStream,
  streamText,
  UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { generateQuiz } from "./src/ai/tools";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { messages }: { messages: UIMessage[] } = req.body;

  const result = streamText({
    model: google("models/gemini-2.0-flash"),
    system:
      "You are a helpful assistant which is able to respond to general user queries as well as generate quizzes over particular topics.",
    messages: convertToModelMessages(messages),
    tools: {
      generateQuiz,
    },
  });

  result.pipeUIMessageStreamToResponse(res);
});

app.post("/api/chat/test", async (_, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Credentials": "true",
    "x-vercel-ai-ui-message-stream": "v1",
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
    console.error("Stream error:", error);
  } finally {
    reader.releaseLock();
    res.end();
  }
});

app.listen(3000, () => {
  console.log(`🚀 Server ready at: http://localhost:3000`);
});
