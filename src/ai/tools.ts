import { tool } from "ai";
import { handleGenerateQuiz } from "../services/quizService";
import z from "zod";

export const generateQuiz = tool({
  description: `Generate a multiple choice quiz when requested. Extract: topic, difficulty level (if mentioned), and number of questions (if specified). 
  Use for: 'create a quiz', 'test my knowledge', 'quiz me'. Don't use for: answering questions about topics.`,
  inputSchema: z.object({
    topic: z
      .string()
      .describe('The topic of the quiz, e.g., "math", "history".'),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .optional()
      .describe("The difficulty level of the quiz."),
    numberOfQuestions: z
      .number()
      .min(1)
      .optional()
      .describe("The number of questions in the quiz."),
  }),
  execute: async function ({
    topic,
    difficulty,
    numberOfQuestions,
  }: {
    topic: string;
    difficulty?: "easy" | "medium" | "hard";
    numberOfQuestions?: number;
  }) {
    return await handleGenerateQuiz({ topic, difficulty, numberOfQuestions });
  },
});

export const tools = {
  generateQuiz,
};
