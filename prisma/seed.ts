import { installGlobals } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

installGlobals();

const prisma = new PrismaClient();

// Sample images from Unsplash (free to use)
const sampleImages = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Create a sample user if none exists
  let user = await prisma.user.findFirst();
  if (!user) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    user = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
        passwordHash: hashedPassword,
        admin: true,
      },
    });
    console.log(
      "✅ Created demo user: demo@example.com (password: password123)",
    );
  } else {
    console.log("✅ Using existing user:", user.email);
  }

  // Create a sample category if none exists
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "General",
        slug: "general",
        description: "General discussion and announcements",
        colorHex: "#3B82F6",
        allowComments: true,
        defaultEmojis: ["👍", "❤️", "🚀", "👏"],
      },
    });
    console.log("✅ Created category:", category.name);
  } else {
    console.log("✅ Using existing category:", category.name);
  }

  // Create sample posts
  const postsToCreate = [
    {
      title: "Welcome to Our Amazing Platform! 🚀",
      content: `# Welcome Everyone!

We're excited to launch this new platform for our community. Here are some of the amazing features we've built:

- **Real-time discussions** - Engage with your team instantly
- **Rich media support** - Share images, links, and formatted content
- **Categories** - Organize your content efficiently
- **Reactions** - Express yourself with emojis

![Welcome Image](${faker.helpers.arrayElement(sampleImages)})

Let us know what you think and feel free to explore all the features. We can't wait to see what conversations emerge!

## Getting Started

1. Create your first post
2. Add some reactions
3. Start meaningful discussions
4. Invite your team members

Happy posting! 🎉`,
    },
    {
      title: "Tips for Better Team Communication 💬",
      content: `# Communication Best Practices

Effective communication is the cornerstone of any successful team. Here are some proven strategies that can help improve your team's collaboration:

## 🎯 Be Clear and Concise
- State your main point upfront
- Use bullet points for clarity
- Avoid unnecessary jargon

## 📸 Visual Communication
Sometimes a picture is worth a thousand words. Here's a beautiful example:

![Communication](${faker.helpers.arrayElement(sampleImages)})

## ⏰ Timing Matters
- Consider time zones for global teams
- Respect focus time and deep work sessions
- Use async communication when possible

## 🔄 Feedback Loop
Regular feedback helps everyone improve:
- Give constructive feedback
- Ask for clarification when needed
- Acknowledge good work publicly

What communication strategies work best for your team? Share your thoughts below!`,
    },
    {
      title: "Productivity Hacks That Actually Work ⚡",
      content: `# Boost Your Productivity Today

After trying countless productivity methods, here are the ones that consistently deliver results:

## The 2-Minute Rule
If a task takes less than 2 minutes, do it immediately. This prevents small tasks from accumulating into overwhelming piles.

## Time Blocking
![Productivity](${faker.helpers.arrayElement(sampleImages)})

Dedicate specific time blocks for different types of work:
- **Deep Work**: 9-11 AM (no meetings, no interruptions)
- **Communication**: 11 AM-12 PM (emails, slack, calls)
- **Creative Work**: 2-4 PM (when energy is renewed)

## The Pomodoro Technique
Work in focused 25-minute intervals followed by 5-minute breaks. It's simple but incredibly effective.

## Environment Design
Your environment shapes your behavior:
- Clean, organized workspace
- Remove distractions (phone, notifications)
- Good lighting and comfortable temperature

## Weekly Reviews
Every Friday, spend 30 minutes reviewing:
- What went well this week?
- What could be improved?
- What are the priorities for next week?

![Focus](${faker.helpers.arrayElement(sampleImages)})

Which productivity technique has worked best for you? Let's share our experiences and learn from each other!`,
    },
  ];

  console.log("📝 Creating sample posts...");

  for (const postData of postsToCreate) {
    const existingPost = await prisma.post.findFirst({
      where: { title: postData.title },
    });

    if (!existingPost) {
      const post = await prisma.post.create({
        data: {
          title: postData.title,
          content: postData.content,
          published: true,
          publishedAt: faker.date.recent(7),
          authorId: user.id,
          categoryId: category.id,
          revisions: {
            create: {
              authorId: user.id,
              title: postData.title,
              content: postData.content,
              categoryId: category.id,
            },
          },
          subscriptions: {
            create: {
              userId: user.id,
            },
          },
        },
      });
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
  .finally(async () => {
    await prisma.$disconnect();
  });
