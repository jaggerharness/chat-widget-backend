import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { Message, QuizDetermination } from "../utils/types";
import { quizDeterminationSchema, quizSchema } from "../utils/schema";

/**
 * Analyzes a user message to determine if they are requesting a quiz.
 * 
 * @param message - The user message to analyze
 * @returns A promise that resolves to an object containing a boolean `quiz` property
 * 
 * @remarks
 * Uses Gemini 2.0 Flash to classify the user's intent. Considers messages requesting
 * quiz generation, knowledge testing, or practice questions as quiz requests.
 * 
 * @example
 * ```typescript
 * const message = { parts: [{ text: "Create a quiz about World War 2" }] };
 * const result = await isQuizRequest(message);
 * console.log(result.quiz); // true
 * ```
 */
export async function isQuizRequest(
  message: Message
): Promise<QuizDetermination> {
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

/**
 * Generates a multiple choice quiz based on the user's request.
 * 
 * @param messages - The user message containing the quiz topic or request
 * @returns A promise that resolves to a quiz object with title and questions
 * 
 * @remarks
 * Uses Gemini 2.0 Flash to generate a quiz with 5 multiple choice questions.
 * Each question includes 4 options with one correct answer. Questions are designed
 * to be clear, challenging, and educational.
 * 
 * @example
 * ```typescript
 * const message = { parts: [{ text: "Create a quiz about photosynthesis" }] };
 * const quiz = await handleGenerateQuiz(message);
 * console.log(quiz.quiz.title); // "Photosynthesis Quiz"
 * console.log(quiz.quiz.questions.length); // 5
 * ```
 */
export async function handleGenerateQuiz(messages: Message) {
  const messageText = messages.parts.map((part) => part.text).join("");
  const result = await generateObject({
    model: google("models/gemini-2.0-flash"),
    schema: quizSchema,
    prompt: `
          Create a quiz based on the user's request: "${messageText}"

          The quiz should contain 5 multiple choice questions that are:
          - Clear and unambiguous
          - Appropriately challenging
          - Educational and informative
          - Include 4 options each with only one correct answer
        `,
  });

  return result.object;
}
