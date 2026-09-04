CREATE TABLE "SlackEmoji" (
	"name" varchar(100) PRIMARY KEY NOT NULL,
	"url" text,
	"aliasFor" varchar(100),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PostReaction" ALTER COLUMN "emoji" SET DATA TYPE varchar(102);