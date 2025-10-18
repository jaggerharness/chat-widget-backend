import z from "zod";

export type Quiz = z.infer<typeof quizSchema>;
export type QuizInput = z.infer<typeof quizInputSchema>;

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
      .describe("Array of quiz questions"),
  }),
});

export const quizInputSchema = z.object({
  topic: z.string().describe('The topic of the quiz, e.g., "math", "history".'),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .optional()
    .describe("The difficulty level of the quiz."),
  numberOfQuestions: z
    .number()
    .min(1)
    .optional()
    .describe("The number of questions in the quiz.")
});
