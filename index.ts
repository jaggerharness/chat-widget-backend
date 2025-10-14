import express from "express";
import cors from "cors";
import {
  convertToModelMessages,
  generateObject,
  simulateReadableStream,
  streamText,
} from "ai";
import { google } from "@ai-sdk/google";
import { ServerResponse } from "http";
import z from "zod";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user"]),
  parts: z.array(
    z.object({
      type: z.enum(["text"]),
      text: z.string().min(1).max(2000),
    })
  ),
});

const chatMessageRequestSchema = z.object({
  id: z.string(),
  message: messageSchema,
});

const quizDeterminationSchema = z.object({
  quiz: z.boolean().describe("Whether the user is requesting a quiz or not"),
});

type Message = z.infer<typeof messageSchema>;
type QuizDetermination = z.infer<typeof quizDeterminationSchema>;

async function isQuizRequest(message: Message): Promise<QuizDetermination> {
  const messageText = message.parts.map((part) => part.text).join(" ");
  const result = await generateObject({
    model: google("models/gemini-2.0-flash"),
    schema: quizDeterminationSchema,
    prompt: `
        Analyze this user message to determine if they are requesting a multiple choice quiz to be generated: "${messageText}"

        QUIZ REQUESTS include:
        - "Create a quiz about [topic]"
        - "Test my knowledge on [subject]"
        - "Make a multiple choice quiz for [topic]"
        - "I want to study [subject] with a quiz"
        - "Quiz me on [topic]"
        - "Generate questions about [subject]"
        - "Help me practice [topic] with questions"

        NOT QUIZ REQUESTS include:
        - General questions: "What is photosynthesis?"
        - Information requests: "Tell me about World War 2"
        - Explanations: "Explain how computers work"
        - Casual conversation: "How are you today?"
        - Help requests: "Help me understand math"

        Return true only if the user is explicitly requesting quiz generation or testing their knowledge with questions.
      `,
  });
  return result.object;
}

function handleGenerateText(message: Message, res: ServerResponse) {
  const result = streamText({
    model: google("models/gemini-2.0-flash"),
    system:
      "You are a helpful assistant which is able to respond to general user queries as well as generate quizzes over particular topics.",
    messages: convertToModelMessages([message]),
  });

  result.pipeUIMessageStreamToResponse(res);
}

async function handleGenerateQuiz(messages: Message) {
  const messageText = messages.parts.map((part) => part.text).join("");
  const result = await generateObject({
    model: google("models/gemini-2.0-flash"),
    schema: z.object({
      quiz: z.object({
        title: z.string().describe("The title of the quiz"),
        questions: z
          .array(
            z.object({
              question: z.string().describe("The quiz question"),
              options: z.array(
                z
                  .string()
                  .describe(
                    "Multiple choice options - each question should have 4 options"
                  )
              ),
              correctAnswer: z
                .string()
                .describe("The correct multiple choice answer"),
            })
          )
          .describe(
            "Array of quiz questions - the quiz should contain 5 questions"
          ),
      }),
    }),
    prompt: `
          Create a quiz based on the user's request: "${messageText}"

          The quiz should contain 5 multiple choice questions that are:
          - Clear and unambiguous
          - Appropriately challenging
          - Educational and informative
          - Include 4 options each with only one correct answer
        `,
  });

  console.log("Generated Quiz:", JSON.stringify(result.object, null, 2));

  return result.object;
}

app.post("/api/chat", async (req, res) => {
  const validatedRequestBody = chatMessageRequestSchema.safeParse(req.body);

  if (!validatedRequestBody.success) {
    console.error(validatedRequestBody);
  } else {
    const requestMessage = validatedRequestBody.data?.message;
    const quizRequest = await isQuizRequest(requestMessage);

    if (quizRequest.quiz) {
      const generatedQuiz = await handleGenerateQuiz(requestMessage);
      res.status(200).json(generatedQuiz);
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
