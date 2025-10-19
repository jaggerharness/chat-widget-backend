import express from "express";
import cors from "cors";
import multer from "multer";
import {
  convertToModelMessages,
  simulateReadableStream,
  streamText,
  UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { generateQuiz } from "./src/ai/tools";
import {
  extractText,
  generateChunksFromText,
  generateEmbeddings,
} from "./src/services/fileService";

const app = express();

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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
    system: `You are a helpful chatbot assistant with quiz generation capabilities. 
    
        You have the following features:
        - You can engage in conversations and answer questions
        - You can generate quizzes on various topics
        - You can accept file uploads (documents, PDFs, etc.) and generate quizzes based on the uploaded material using RAG (Retrieval Augmented Generation)

        When users ask about uploading files, inform them that they can upload files, and you'll use the content to create relevant quizzes tailored to their material. 
        Let them know to use the button below that has the paperclip on it to upload their files.`,
    messages: convertToModelMessages(messages),
    tools: {
      generateQuiz,
    },
  });

  result.pipeUIMessageStreamToResponse(res);
});

app.post("/api/files/upload", upload.array("files"), async (req, res) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  files.forEach(async (file) => {
    const text = await extractText(file);
    const chunks = await generateChunksFromText(text);
    const embeddings = await generateEmbeddings(chunks);
    console.log({ embeddings });
  });

  return res.status(200).json({ files });
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
