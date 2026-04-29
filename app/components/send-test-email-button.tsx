import { useState } from "react";

import Button from "./button";

type Status = "idle" | "sending" | "sent" | "error";

export default function SendTestEmailButton({ postId }: { postId: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const send = async () => {
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch(`/api/posts/${postId}/test-email`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { to?: string; error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setStatus("sent");
      setMessage(data.to ? `Sent to ${data.to}` : "Sent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Network error");
    }
  };

  const label =
    status === "sending"
      ? "Sending…"
      : status === "sent"
        ? "Send another test email"
        : "Send test email";

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        baseStyle="link"
        size="xs"
        onClick={send}
        disabled={status === "sending"}
        title="Send this post's announcement email to your own admin address."
      >
        {label}
      </Button>
      {message && (
        <span
          className={
            status === "error"
              ? "text-sm text-red-500"
              : "text-sm text-muted-light dark:text-muted-dark"
          }
        >
          {message}
        </span>
      )}
    </span>
  );
}
