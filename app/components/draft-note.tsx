import { useEffect, useRef, useState } from "react";
import { Form } from "react-router";
import { ChevronDownIcon } from "@radix-ui/react-icons";

import type { Post } from "~/models/post.server";
import classNames from "~/lib/classNames";
import Button from "./button";
import HelpText from "./help-text";
import { getPostLink } from "./post-link";

type PublishMode = "announce" | "true";

const COPY: Record<PublishMode, { title: string; body: string; confirmLabel: string }> = {
  announce: {
    title: "Publish this post?",
    body: "This will make the post visible to everyone and send announcements via email and Slack (if configured).",
    confirmLabel: "Publish",
  },
  true: {
    title: "Publish this post silently?",
    body: "This will make the post visible to everyone. No announcements will be sent.",
    confirmLabel: "Publish Silently",
  },
};

export default function DraftNote({ post }: { post: Post }) {
  const [isOpen, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<PublishMode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: Event) => {
      if (e.target && !dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isOpen]);

  // Close the confirm dialog on ESC.
  useEffect(() => {
    if (!confirming) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [confirming]);

  const openConfirm = (mode: PublishMode) => {
    setOpen(false);
    setConfirming(mode);
  };

  const cancelConfirm = () => setConfirming(null);

  const submitConfirmed = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <Form
        ref={formRef}
        className="rounded-full p-6 bg-violet-900 text-white flex justify-center items-center mb-12 gap-6"
        method="post"
        action={`${getPostLink(post)}/edit`}
      >
        <p>This post has not been published, and is only visible if you have the link.</p>

        {/* Hidden field carries the chosen publish mode through to the action. */}
        <input type="hidden" name="published" value={confirming ?? ""} />

        <div className="relative" ref={dropdownRef}>
          <Button
            type="button"
            mode="primary"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isOpen}
          >
            <span className="inline-flex items-center gap-1">
              Publish
              <ChevronDownIcon width="16" height="16" />
            </span>
          </Button>

          <div
            role="menu"
            className={classNames(
              "whitespace-nowrap text-primary-light dark:text-primary-dark bg-bg-light dark:bg-bg-dark shadow-lg rounded absolute right-0 mt-2 flex-col z-10",
              isOpen ? "flex" : "hidden",
            )}
          >
            <button
              type="button"
              role="menuitem"
              className="flex flex-col text-left px-4 py-2 cursor-pointer relative rounded-md text-button-default-text-light dark:text-button-default-text-dark bg-button-default-bg-light dark:bg-button-default-bg-dark first:rounded-b-none last:rounded-t-none hover:text-button-primary-text-light dark:hover:text-button-primary-text-dark hover:bg-button-primary-bg-light dark:hover:bg-button-primary-bg-dark"
              onClick={() => openConfirm("announce")}
            >
              Publish
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex flex-col text-left px-4 py-2 cursor-pointer relative rounded-md text-button-default-text-light dark:text-button-default-text-dark bg-button-default-bg-light dark:bg-button-default-bg-dark first:rounded-b-none last:rounded-t-none hover:text-button-primary-text-light dark:hover:text-button-primary-text-dark hover:bg-button-primary-bg-light dark:hover:bg-button-primary-bg-dark"
              onClick={() => openConfirm("true")}
            >
              Publish Silently
              <HelpText>Don't send announcements (if configured).</HelpText>
            </button>
          </div>
        </div>
      </Form>

      {confirming && (
        <ConfirmPublishDialog
          mode={confirming}
          onCancel={cancelConfirm}
          onConfirm={submitConfirmed}
        />
      )}
    </>
  );
}

function ConfirmPublishDialog({
  mode,
  onCancel,
  onConfirm,
}: {
  mode: PublishMode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { title, body, confirmLabel } = COPY[mode];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-publish-title"
    >
      <div
        className="bg-bg-light dark:bg-bg-dark text-primary-light dark:text-primary-dark rounded-lg shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-publish-title" className="text-xl font-semibold mb-3">
          {title}
        </h2>
        <p className="mb-6">{body}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" mode="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" mode="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
