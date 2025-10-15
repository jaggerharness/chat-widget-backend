import z from "zod";
import { messageSchema, quizDeterminationSchema } from "./schema";

export type Message = z.infer<typeof messageSchema>;
export type QuizDetermination = z.infer<typeof quizDeterminationSchema>;