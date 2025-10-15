import z from "zod";

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user"]),
  parts: z.array(
    z.object({
      type: z.enum(["text"]),
      text: z.string().min(1).max(2000),
    })
  ),
});

export const chatMessageRequestSchema = z.object({
  id: z.string(),
  message: messageSchema,
});

export const quizDeterminationSchema = z.object({
  quiz: z.boolean().describe("Whether the user is requesting a quiz or not"),
});

export const quizSchema = z.object({
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
});
