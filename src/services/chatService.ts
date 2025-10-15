import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { Message } from "../utils/types";
import { ServerResponse } from "http";

export function handleGenerateText(message: Message, res: ServerResponse) {
  const result = streamText({
    model: google("models/gemini-2.0-flash"),
    system:
      "You are a helpful assistant which is able to respond to general user queries as well as generate quizzes over particular topics.",
    messages: convertToModelMessages([message]),
  });

  result.pipeUIMessageStreamToResponse(res);
}