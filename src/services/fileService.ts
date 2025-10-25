import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import { geminiTextEmbeddingDimensions } from "../db/schema";

export const extractText = async (file: Express.Multer.File) => {
  const parser = new PDFParse({ data: file.buffer });
  const textResult = await parser.getText();

  await parser.destroy();

  return textResult.text;
};

export const generateChunksFromText = async (text: string) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  return await splitter.splitText(text);
};

export const generateEmbeddings = async (chunks: string[]) => {
  const model = google.textEmbedding("text-embedding-004");

  const { embeddings } = await embedMany({
    model,
    values: chunks,
    providerOptions: { google: { dimensions: geminiTextEmbeddingDimensions }, },
  });

  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
