// @ts-nocheck
import { faker } from "@faker-js/faker";

import bcrypt from "bcryptjs";

import { db } from "../app/db/client";
import { categories, posts, postRevisions, postSubscriptions, users } from "../app/db/schema";

// Sample images from Unsplash (free to use)
const sampleImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a sample user if none exists
  let user = await db.query.users.findFirst();
  if (!user) {
    const passwordHash = await bcrypt.hash("password123", 10);
    [user] = await db
      .insert(users)
      .values({
        email: "demo@example.com",
        name: "Demo User",
        passwordHash,
        admin: true,
      })
      .returning();
    console.log("✅ Created demo user: demo@example.com (password: password123)");
  } else {
    console.log("✅ Using existing user:", user.email);
  }

  // Create a sample category if none exists
  let category = await db.query.categories.findFirst();
  if (!category) {
    [category] = await db
      .insert(categories)
      .values({
        name: "General",
        slug: "general",
        description: "General discussion and announcements",
        colorHex: "#3B82F6",
        allowComments: true,
        defaultEmojis: ["👍", "❤️", "🚀", "👏"],
      })
      .returning();
    console.log("✅ Created category:", category.name);
  } else {
    console.log("✅ Using existing category:", category.name);
  }

  // Create sample posts
  const postsToCreate: Array<{ title: string; content: string }> = [
    {
      title: "Welcome to Our Amazing Platform! 🚀",
      content: `# Welcome Everyone!\n\nWe're excited to launch this new platform for our community.\n\n![Welcome Image](${faker.helpers.arrayElement(sampleImages)})\n\nHappy posting! 🎉`,
    },
    {
      title: "Tips for Better Team Communication 💬",
      content: `# Communication Best Practices\n\n![Communication](${faker.helpers.arrayElement(sampleImages)})\n\nEffective communication is the cornerstone of any successful team.`,
    },
    {
      title: "Productivity Hacks That Actually Work ⚡",
      content: `# Boost Your Productivity Today\n\n![Productivity](${faker.helpers.arrayElement(sampleImages)})\n\nAfter trying countless productivity methods, here are the ones that consistently deliver results.`,
    },
  ];

  console.log("📝 Creating sample posts...");

  for (const postData of postsToCreate) {
    const existing = await db.query.posts.findFirst({
      where: (p, { eq }) => eq(p.title, postData.title),
    });

    if (!existing) {
      const [post] = await db
        .insert(posts)
        .values({
          title: postData.title,
          content: postData.content,
          published: true,
          publishedAt: faker.date.recent(7),
          authorId: user.id,
          categoryId: category.id,
        })
        .returning();

      await db.insert(postRevisions).values({
        authorId: user.id,
        title: postData.title,
        content: postData.content,
        categoryId: category.id,
        postId: post.id,
      });

      await db.insert(postSubscriptions).values({ userId: user.id, postId: post.id });

      console.log("✅ Created post:", post.title);
    } else {
      console.log("⏭️  Post already exists:", postData.title);
    }
  }

  console.log("🎉 Seeding completed!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
