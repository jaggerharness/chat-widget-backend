import { tool } from "ai";
import { handleGenerateQuiz } from "../services/quizService";
import { QuizInput, quizInputSchema, getInformationSchema } from "../utils/schema";
import { findRelevantContent } from "../services/ragService";

export const generateQuiz = tool({
  description: `Generate a multiple choice quiz when requested. Extract: topic, difficulty level (if mentioned), and number of questions (if specified). 
  Use for: 'create a quiz', 'test my knowledge', 'quiz me'. Don't use for: answering questions about topics.`,
  inputSchema: quizInputSchema,
  execute: async function ({
    topic,
    difficulty,
    numberOfQuestions,
  }: QuizInput) {
    return await handleGenerateQuiz({ topic, difficulty, numberOfQuestions });
  },
});

export const checkKnowledgeBase = tool({
  description: `Get information from your knowledge base to answer questions.`,
  inputSchema: getInformationSchema,
  execute: async ({ question }) => findRelevantContent(question),
});
