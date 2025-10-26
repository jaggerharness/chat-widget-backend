import { generateObject, GenerateObjectResult } from "ai";
import { google } from "@ai-sdk/google";
import { Quiz, quizSchema, QuizInput } from "../utils/schema";

export async function handleGenerateQuiz({
  topic,
  difficulty,
  numberOfQuestions,
}: QuizInput): Promise<GenerateObjectResult<Quiz>> {
  const result = await generateObject({
    model: google("models/gemini-2.0-flash"),
    schema: quizSchema,
    prompt: `
          Create a quiz based on the following parameters:
          - Topic: ${topic}
          - Difficulty: ${difficulty ?? "medium"}
          - Number of Questions: ${numberOfQuestions ?? 5}

          The quiz should contain multiple choice questions that are:
          - Clear and unambiguous
          - Appropriately challenging
          - Educational and informative
          - Include 4 options each with only one correct answer
        `,
  });

  return result;
}
