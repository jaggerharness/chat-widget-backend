import express from "express";
import cors from "cors";
import { simulateReadableStream } from "ai";
import {
  chatMessageRequestSchema,
} from "./src/utils/schema";
import { handleGenerateText } from "./src/services/chatService";
import { handleGenerateQuiz, isQuizRequest } from "./src/services/quizService";
import { HTTP_STATUS } from "./src/utils/http";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const validatedRequestBody = chatMessageRequestSchema.safeParse(req.body);

  if (!validatedRequestBody.success) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Invalid request body" });
  } else {
    const requestMessage = validatedRequestBody.data?.message;
    const quizRequest = await isQuizRequest(requestMessage);

    if (quizRequest.quiz) {
      const generatedQuiz = await handleGenerateQuiz(requestMessage);
      res.status(HTTP_STATUS.OK).json(generatedQuiz);
    } else {
      handleGenerateText(requestMessage, res);
    }
  }
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
