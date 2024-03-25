import type { LoaderFunctionArgs } from "@remix-run/node";
import { getFeed } from "~/models/feed.server";
import { getPostList } from "~/models/post.server";
import { getPostLink } from "~/components/post-link";
import invariant from "tiny-invariant";
import { marked } from "marked";
import { escapeCdata, escapeHtml } from "~/lib/html";
import summarize from "~/lib/summarize";
import { buildUrl } from "~/lib/http";

export async function loader({ request, params }: LoaderFunctionArgs) {
  invariant(params.feedId, "feedId not found");
  const feed = await getFeed({ id: params.feedId });
  if (!feed) throw new Response("Not Found", { status: 404 });

  const posts = await getPostList({
    published: true,
    feedId: params.feedId,
  });
  const baseUrl = buildUrl("/", request);

  const rssString = `
    <rss xmlns:blogChannel="${baseUrl}" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
      <channel>
        <title>${feed.name}</title>
        <link>${baseUrl}</link>
        <description></description>
        <language>en-us</language>
        <generator>Vanguard</generator>
        ${posts
          .map((post) =>
            `
            <item>
              <guid>${post.id}</guid>
              <title><![CDATA[${escapeCdata(post.title)}]]></title>
              <description>${escapeHtml(
                summarize(post.content || ""),
              )}</description>
              <category>${escapeHtml(post.category.name)}</category>
              <content:encoded><![CDATA[${escapeCdata(
                marked.parse(post.content as string, {
                  breaks: true,
                  baseUrl: process.env.BASE_URL,
                }),
              )}]]></content:encoded>
              <author>${escapeHtml(
                post.author.name || post.author.email,
              )}</author>
              <pubDate>${post.publishedAt?.toUTCString()}</pubDate>
              <link>${buildUrl(getPostLink(post), request)}</link>

              <vg:avatar>{${escapeHtml(post.author.picture || "")}}</vg:avatar>
            </item>
          `.trim(),
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
}
