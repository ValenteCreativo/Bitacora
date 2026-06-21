import { db } from "./index";
import { collections, channels, tags } from "./schema";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

/**
 * Simple slugify: lowercase, replace spaces/special chars with hyphens,
 * remove consecutive hyphens, trim leading/trailing hyphens.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphens
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

const SEED_COLLECTIONS = [
  "Doctorado",
  "Portfolio",
  "Jarvis",
  "Hackathons",
  "Ciberseguridad",
  "Música",
  "Clientes",
  "Investigación ambiental",
];

const SEED_CHANNELS = [
  "Inbox",
  "Read Later",
  "AI Tools",
  "Tesis",
  "Forecasting",
  "DePIN",
  "Sensores",
  "Visual Inspiration",
  "Matemáticas",
  "GitHub Repos",
  "Articles",
  "Videos",
];

const SEED_TAGS = [
  "paper",
  "github",
  "video",
  "tool",
  "idea",
  "reference",
  "client",
  "read-later",
  "inspiration",
  "research",
  "ai",
  "forecasting",
  "depin",
  "sensors",
];

async function seed() {
  const now = Date.now();

  console.log("🌱 Seeding collections...");
  for (const name of SEED_COLLECTIONS) {
    const slug = slugify(name);
    await db.insert(collections).values({
      id: nanoid(),
      name,
      slug,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing({ target: collections.slug });
  }

  console.log("🌱 Seeding channels...");
  for (const name of SEED_CHANNELS) {
    const slug = slugify(name);
    await db.insert(channels).values({
      id: nanoid(),
      name,
      slug,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing({ target: channels.slug });
  }

  console.log("🌱 Seeding tags...");
  for (const name of SEED_TAGS) {
    const slug = slugify(name);
    await db.insert(tags).values({
      id: nanoid(),
      name,
      slug,
      createdAt: now,
    }).onConflictDoNothing({ target: tags.slug });
  }

  console.log("✅ Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
