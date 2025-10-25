import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";

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
  const model = google.textEmbedding("gemini-embedding-001");

  const { embeddings } = await embedMany({
    model,
    values: chunks,
  });

  return embeddings;
};
