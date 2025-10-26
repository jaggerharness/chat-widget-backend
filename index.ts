import express from "express";
import cors from "cors";
import multer from "multer";
import {
  convertToModelMessages,
  hasToolCall,
  simulateReadableStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { generateQuiz, checkKnowledgeBase } from "./src/ai/tools";
import {
  extractText,
  generateChunksFromText,
  generateEmbeddings,
} from "./src/services/ragService";
import { drizzle } from "drizzle-orm/node-postgres";
import { embeddingsTable } from "./src/db/schema";

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

export const db = drizzle(process.env.DATABASE_URL!);

app.post("/api/chat", async (req, res) => {
  const { messages }: { messages: UIMessage[] } = req.body;

  const result = streamText({
    model: google("models/gemini-2.0-flash"),
    system: `You are a helpful AI assistant with quiz generation capabilities.

      **Your abilities:**
      - Answer questions and engage in conversations
      - Generate interactive quizzes on any topic
      - Use uploaded documents to create tailored quizzes / responses via RAG (Retrieval Augmented Generation)

      **IMPORTANT: Always follow this workflow:**
      1. For ANY quiz request, FIRST use the checkKnowledgeBase tool to search for relevant information
      2. Review the knowledge base results thoroughly
      3. THEN use generateQuiz tool with the retrieved information
      4. If no relevant information is found, mention this and use your general knowledge

      **Guidelines:**
      - NEVER call generateQuiz without first calling checkKnowledgeBase
      - When users mention file uploads, let them know they can upload documents (PDFs, text files, etc.) using the paperclip button below
      - Explain that uploaded files will be used to create personalized quizzes based on their content

      **Tone:** Friendly, helpful, and encouraging.`,
    messages: convertToModelMessages(messages),
    stopWhen: [hasToolCall("generateQuiz"), stepCountIs(5)],
    tools: {
      checkKnowledgeBase,
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
    const insertResponse = await db.insert(embeddingsTable).values(embeddings);
    console.log({ insertResponse });
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
