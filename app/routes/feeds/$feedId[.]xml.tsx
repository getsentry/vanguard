import type { LoaderFunction } from "@remix-run/node";
import { getFeed } from "~/models/feed.server";
import { getPostList } from "~/models/post.server";
import { requireUserId } from "~/session.server";
import { getPostLink } from "~/components/post-link";
import invariant from "tiny-invariant";
import { marked } from "marked";
import { escapeCdata } from "~/lib/html";

export const loader: LoaderFunction = async ({ request, params }) => {
  invariant(params.feedId, "feedId not found");
  const userId = await requireUserId(request);

  const feed = await getFeed({ id: params.feedId });
  if (!feed) throw new Response("Not Found", { status: 404 });

  const posts = await getPostList({
    userId,
    published: true,
    feedId: params.feedId,
  });

  const rssString = `
    <rss xmlns:blogChannel="${process.env.BASE_URL}" version="2.0">
      <channel>
        <title>${feed.name}</title>
        <link>${process.env.BASE_URL}</link>
        <description></description>
        <language>en-us</language>
        <generator>Vanguard</generator>
        ${posts
          .map((post) =>
            `
            <item>
              <title><![CDATA[${escapeCdata(post.title)}]]></title>
              <description><![CDATA[${escapeCdata(
                marked.parse(post.content as string, { breaks: true })
              )}]]></description>
              <author><![CDATA[${escapeCdata(post.author.name)}]]></author>
              <pubDate>${post.publishedAt.toUTCString()}</pubDate>
              <link>${process.env.BASE_URL}${getPostLink(post)}</link>
              <guid>${post.id}</guid>
            </item>
          `.trim()
          )
          .join("\n")}
      </channel>
    </rss>
  `.trim();

  return new Response(rssString, {
    headers: {
      "Cache-Control": `public, max-age=${60 * 10}, s-maxage=${60 * 60 * 24}`,
      "Content-Type": "application/xml",
      "Content-Length": String(Buffer.byteLength(rssString)),
    },
  });
};
