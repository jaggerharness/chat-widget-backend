import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { embeddingsTable, geminiTextEmbeddingDimensions } from "../db/schema";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "../../index";

const model = google.textEmbedding("text-embedding-004");

export const extractText = async (file: Express.Multer.File) => {
  const parser = new PDFParse({ data: file.buffer });
  const textResult = await parser.getText();

  await parser.destroy();

  return textResult.text;
};

export const generateChunksFromText = async (text: string) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 50,
  });
  return await splitter.splitText(text);
};

export const generateEmbeddings = async (chunks: string[]) => {
  

  const { embeddings } = await embedMany({
    model,
    values: chunks,
    providerOptions: { google: { dimensions: geminiTextEmbeddingDimensions } },
  });

  return embeddings.map((embedding, index) => ({
    content: chunks[index],
    embedding,
  }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: model,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddingsTable.embedding,
    userQueryEmbedded,
  )})`;
  const similarGuides = await db
    .select({ name: embeddingsTable.content, similarity })
    .from(embeddingsTable)
    .where(gt(similarity, 0.65))
    .orderBy(t => desc(t.similarity))
    .limit(4);
  console.log({ similarGuides });
  return similarGuides;
};
