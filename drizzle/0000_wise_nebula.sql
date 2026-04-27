CREATE TABLE "Category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"colorHex" varchar(7),
	"allowComments" boolean DEFAULT true NOT NULL,
	"defaultEmojis" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "Category_name_unique" UNIQUE("name"),
	CONSTRAINT "Category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "CategoryEmail" (
	"id" text PRIMARY KEY NOT NULL,
	"categoryId" text NOT NULL,
	"to" text NOT NULL,
	"subjectPrefix" text
);
--> statement-breakpoint
CREATE TABLE "CategoryMeta" (
	"id" text PRIMARY KEY NOT NULL,
	"categoryId" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CategorySlack" (
	"id" text PRIMARY KEY NOT NULL,
	"categoryId" text NOT NULL,
	"webhookUrl" text NOT NULL,
	"username" text,
	"iconUrl" text,
	"channel" text
);
--> statement-breakpoint
CREATE TABLE "_FeedToPost" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Feed" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"restricted" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"url" text,
	"webhookUrl" text,
	CONSTRAINT "Feed_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "PostComment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"parentId" text
);
--> statement-breakpoint
CREATE TABLE "PostMeta" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PostReaction" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"emoji" varchar(8) NOT NULL,
	CONSTRAINT "PostReaction_postId_authorId_emoji_unique" UNIQUE("postId","authorId","emoji")
);
--> statement-breakpoint
CREATE TABLE "PostRevision" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"authorId" text NOT NULL,
	"title" varchar(255),
	"content" text,
	"categoryId" text
);
--> statement-breakpoint
CREATE TABLE "PostSubscription" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PostSubscription_postId_userId_unique" UNIQUE("postId","userId")
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"publishedAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"published" boolean DEFAULT false NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"authorId" text NOT NULL,
	"categoryId" text NOT NULL,
	"allowComments" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"passwordHash" varchar(255),
	"externalId" text,
	"picture" text,
	"email" text NOT NULL,
	"name" text,
	"canPostRestricted" boolean DEFAULT false NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	"notifyReplies" boolean DEFAULT true NOT NULL,
	CONSTRAINT "User_externalId_unique" UNIQUE("externalId"),
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "CategoryEmail" ADD CONSTRAINT "CategoryEmail_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CategoryMeta" ADD CONSTRAINT "CategoryMeta_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CategorySlack" ADD CONSTRAINT "CategorySlack_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_FeedToPost" ADD CONSTRAINT "_FeedToPost_A_Feed_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_FeedToPost" ADD CONSTRAINT "_FeedToPost_B_Post_id_fk" FOREIGN KEY ("B") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostMeta" ADD CONSTRAINT "PostMeta_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostRevision" ADD CONSTRAINT "PostRevision_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostSubscription" ADD CONSTRAINT "PostSubscription_postId_Post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PostSubscription" ADD CONSTRAINT "PostSubscription_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_categoryId_Category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;