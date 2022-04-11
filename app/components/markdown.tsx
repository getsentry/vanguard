import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

export default function Markdown({ content }: { content: string }) {
  const html = DOMPurify.sanitize(marked.parse(content, { breaks: true }));
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
