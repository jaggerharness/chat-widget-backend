import { index, integer, pgTable, text, vector } from "drizzle-orm/pg-core";

export const embeddingsTable = pgTable(
  "embeddings",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
