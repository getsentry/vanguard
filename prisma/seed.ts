import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { installGlobals } from "@remix-run/node";
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
      "✅ Created demo user: demo@example.com (password: password123)"
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
  const postsToCreate: Array<{ title: string; content: string }> = [
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
    {
      title: "Code Highlighting Test Document",
      content: `This document contains sample code blocks for all supported syntax highlighting languages in Vanguard.

## JavaScript

\`\`\`javascript
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

const user = { name: "World", age: 42 };
greet(user.name);

// Arrow function example
const add = (a, b) => a + b;
const result = add(5, 3);
\`\`\`

## TypeScript

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email?: string;
}

function createUser(name: string, id: number): User {
  return {
    id,
    name,
  };
}

const user: User = createUser("Alice", 1);
console.log(user);
\`\`\`

## JSX

\`\`\`jsx
import React, { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;
\`\`\`

## TSX

\`\`\`tsx
import React, { useState } from "react";

interface CounterProps {
  initialValue?: number;
}

const Counter: React.FC<CounterProps> = ({ initialValue = 0 }) => {
  const [count, setCount] = useState<number>(initialValue);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default Counter;
\`\`\`

## Python

\`\`\`python
def fibonacci(n):
    """Generate Fibonacci sequence up to n terms."""
    a, b = 0, 1
    sequence = []
    for _ in range(n):
        sequence.append(a)
        a, b = b, a + b
    return sequence

# Example usage
result = fibonacci(10)
print(f"Fibonacci sequence: {result}")

# List comprehension
squares = [x**2 for x in range(10)]
\`\`\`

## Ruby

\`\`\`ruby
class Person
  attr_accessor :name, :age

  def initialize(name, age)
    @name = name
    @age = age
  end

  def greet
    "Hello, I'm #{@name} and I'm #{@age} years old."
  end
end

person = Person.new("Alice", 30)
puts person.greet

# Block example
[1, 2, 3].each do |num|
  puts num * 2
end
\`\`\`

## Go

\`\`\`go
package main

import (
    "fmt"
    "time"
)

type User struct {
    ID    int
    Name  string
    Email string
}

func (u *User) String() string {
    return fmt.Sprintf("User{ID: %d, Name: %s}", u.ID, u.Name)
}

func main() {
    user := &User{
        ID:    1,
        Name:  "Alice",
        Email: "alice@example.com",
    }
    fmt.Println(user)
}
\`\`\`

## Rust

\`\`\`rust
use std::collections::HashMap;

struct User {
    id: u32,
    name: String,
    email: Option<String>,
}

impl User {
    fn new(id: u32, name: String) -> Self {
        User {
            id,
            name,
            email: None,
        }
    }

    fn greet(&self) -> String {
        format!("Hello, I'm {}", self.name)
    }
}

fn main() {
    let user = User::new(1, "Alice".to_string());
    println!("{}", user.greet());
}
\`\`\`

## Java

\`\`\`java
public class User {
    private int id;
    private String name;
    private String email;

    public User(int id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public String greet() {
        return "Hello, I'm " + this.name;
    }

    public static void main(String[] args) {
        User user = new User(1, "Alice", "alice@example.com");
        System.out.println(user.greet());
    }
}
\`\`\`

## Swift

\`\`\`swift
import Foundation

struct User {
    let id: Int
    var name: String
    var email: String

    init(id: Int, name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
    }

    func greet() -> String {
        return "Hello, I'm \\(name)"
    }
}

// Protocol example
protocol UserService {
    func fetchUser(id: Int) async throws -> User?
}

class UserServiceImpl: UserService {
    func fetchUser(id: Int) async throws -> User? {
        // Simulate network call
        try await Task.sleep(nanoseconds: 1_000_000_000)
        return User(id: id, name: "Alice", email: "alice@example.com")
    }
}

// Usage with async/await
Task {
    let service = UserServiceImpl()
    if let user = try await service.fetchUser(id: 1) {
        print(user.greet())
    }
}
\`\`\`

## Objective-C

\`\`\`objectivec
#import <Foundation/Foundation.h>

@interface User : NSObject

@property (nonatomic, assign) NSInteger userId;
@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSString *email;

- (instancetype)initWithId:(NSInteger)userId
                       name:(NSString *)name
                      email:(NSString *)email;
- (NSString *)greet;

@end

@implementation User

- (instancetype)initWithId:(NSInteger)userId
                       name:(NSString *)name
                      email:(NSString *)email {
    self = [super init];
    if (self) {
        _userId = userId;
        _name = name;
        _email = email;
    }
    return self;
}

- (NSString *)greet {
    return [NSString stringWithFormat:@"Hello, I'm %@", self.name];
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        User *user = [[User alloc] initWithId:1
                                         name:@"Alice"
                                        email:@"alice@example.com"];
        NSLog(@"%@", [user greet]);
    }
    return 0;
}
\`\`\`

## SQL

\`\`\`sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com');

-- Query with JOIN
SELECT u.id, u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.name
ORDER BY post_count DESC;
\`\`\`

## HTML/Markup

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Page</title>
</head>
<body>
    <header>
        <h1>Welcome</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <article>
            <h2>Article Title</h2>
            <p>Content goes here.</p>
        </article>
    </main>
</body>
</html>
\`\`\`

## CSS

\`\`\`css
/* Global styles */
:root {
    --primary-color: #3b82f6;
    --secondary-color: #8b5cf6;
    --spacing-unit: 1rem;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-unit);
}

.button {
    background-color: var(--primary-color);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
}

.button:hover {
    background-color: var(--secondary-color);
}

@media (max-width: 768px) {
    .container {
        padding: calc(var(--spacing-unit) / 2);
    }
}
\`\`\`

## JSON

\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "email": "alice@example.com",
      "roles": ["admin", "user"],
      "metadata": {
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-15T10:30:00Z"
      }
    },
    {
      "id": 2,
      "name": "Bob",
      "email": "bob@example.com",
      "roles": ["user"]
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 2
  }
}
\`\`\`

## YAML

\`\`\`yaml
# Application configuration
app:
  name: Vanguard
  version: 1.0.0
  environment: production

database:
  host: localhost
  port: 5432
  name: vanguard
  ssl: true

features:
  - authentication
  - posts
  - comments
  - reactions

users:
  - name: Alice
    email: alice@example.com
    role: admin
  - name: Bob
    email: bob@example.com
    role: user
\`\`\`

## Bash/Shell

\`\`\`bash
#!/bin/bash

# Script to process user data
USERS_FILE="users.json"
OUTPUT_DIR="./output"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Process each user
while IFS= read -r line; do
    USER_ID=$(echo "$line" | jq -r '.id')
    USER_NAME=$(echo "$line" | jq -r '.name')

    echo "Processing user: $USER_NAME (ID: $USER_ID)"

    # Generate report
    REPORT_FILE="$OUTPUT_DIR/user_\${USER_ID}_report.txt"
    echo "User Report for $USER_NAME" > "$REPORT_FILE"
done < <(jq -c '.users[]' "$USERS_FILE")

echo "Processing complete!"
\`\`\`

## Shell Session

\`\`\`shell-session
$ cd /var/www/vanguard
$ pnpm install
Packages: +1221
✔ Generated Prisma Client

$ pnpm dev
> vanguard@ dev
> run-p dev:*

[remix] Remix App Server started at http://localhost:3000
[server] Server running on port 3000

$ curl http://localhost:3000/api/health
{"status":"ok"}
\`\`\`

## Git

\`\`\`git
# Create a new branch
git checkout -b feature/code-highlighting

# Stage changes
git add app/components/markdown.tsx

# Commit with message
git commit -m "Fix code highlighting by loading Prism.js languages"

# Push to remote
git push origin feature/code-highlighting

# Create pull request
gh pr create --title "Fix code highlighting" --body "Loads Prism.js languages for proper syntax highlighting"
\`\`\`

## Diff

\`\`\`diff
--- a/app/components/markdown.tsx
+++ b/app/components/markdown.tsx
@@ -1,6 +1,30 @@
 import { marked } from "marked";
 import { sanitize } from "isomorphic-dompurify";
 import prismjs from "prismjs";
+
+// Load Prism.js languages
+import "prismjs/components/prism-javascript";
+import "prismjs/components/prism-typescript";
+import "prismjs/components/prism-python";
+
 const renderer = new marked.Renderer();

 renderer.code = function (code, lang, escaped) {
+  // Normalize language name
+  const normalizedLang = languageAliases[lang.toLowerCase()] || lang.toLowerCase();
+
   code = this.options.highlight(code, lang);
   return \`<pre class="code-block"><code>\${code}</code></pre>\`;
\`\`\`

## Markdown

\`\`\`\`markdown
# Heading 1

## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2
- List item 3

1. Numbered item 1
2. Numbered item 2

[Link text](https://example.com)

![Image alt text](image.png)

> This is a blockquote

\`inline code\`

‵‵‵javascript
const code = "block";
‵‵‵
\`\`\`\`

## C/C++ (C-like)

\`\`\`c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    char name[100];
    char email[100];
} User;

User* create_user(int id, const char* name, const char* email) {
    User* user = (User*)malloc(sizeof(User));
    user->id = id;
    strncpy(user->name, name, sizeof(user->name) - 1);
    strncpy(user->email, email, sizeof(user->email) - 1);
    return user;
}

int main() {
    User* user = create_user(1, "Alice", "alice@example.com");
    printf("User: %s (%d)\\n", user->name, user->id);
    free(user);
    return 0;
}
\`\`\`

## Language Aliases Test

These should also work due to our alias mapping:

\`\`\`js
// JavaScript alias
const x = 1;
\`\`\`

\`\`\`ts
// TypeScript alias
const x: number = 1;
\`\`\`

\`\`\`py
# Python alias
x = 1
\`\`\`

\`\`\`sh
# Shell alias
echo "Hello"
\`\`\`

\`\`\`yml
# YAML alias
key: value
\`\`\`

\`\`\`md
# Markdown alias
**bold text**
\`\`\`

\`\`\`objc
// Objective-C alias
#import <Foundation/Foundation.h>
NSString *name = @"Alice";
\`\`\`

## Code Block Without Language

\`\`\`
This is a code block without a language specified.
It should still render properly but without syntax highlighting.
\`\`\``,
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
