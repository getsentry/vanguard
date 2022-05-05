import { Fragment, useRef, useState } from "react";
import { Form } from "@remix-run/react";

import type { Category } from "../models/category.server";
import Editor from "./editor";
import useLocalStorage from "~/lib/useLocalStorage";

export type PostFormErrors = {
  title?: string;
  content?: string;
  categoryId?: string;
};

export type PostFormInitialData = {
  title?: string;
  content?: string;
  categoryId?: string;
  published?: boolean;
  announce?: boolean;
};

const AnnounceOption = ({
  category,
  defaultChecked,
}: {
  category?: Category;
  defaultChecked?: boolean;
}) => {
  if (!category) return null;
  const locations: string[] = Array.from(
    new Set([
      ...category.slackConfig.map((c) => c.channel || "Slack"),
      ...category.emailConfig.map((c) => c.to),
    ])
  );
  if (!locations.length) return null;
  return (
    <div>
      <label>
        <input
          type="checkbox"
          name="announce"
          defaultChecked={defaultChecked}
        />
        Announce this post to {locations.join(", ")} (only on publish)
      </label>
    </div>
  );
};

export default function PostForm({
  categoryList,
  errors,
  initialData,
}: {
  categoryList: Category[];
  errors?: PostFormErrors;
  initialData?: PostFormInitialData;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [storedDraft, setStoredDraft] = useLocalStorage("draft", {});

  if (!initialData) {
    initialData = storedDraft;
  }

  const [categoryId, setCategoryId] = useState<string | null>(
    initialData?.categoryId || null
  );

  initialData.announce = !initialData?.published;

  return (
    <Form
      method="post"
      ref={formRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      className="p-4"
      onSubmit={() => {
        setStoredDraft({});
      }}
      onChange={(e) => {
        setStoredDraft({ ...storedDraft, [e.target.name]: e.target.value });
      }}
    >
      <div>
        <label className="">
          <span>Title: </span>
          <input
            name="title"
            required
            placeholder="Title"
            autoFocus
            defaultValue={initialData?.title}
            aria-invalid={errors?.title ? true : undefined}
            aria-errormessage={errors?.title ? "title-error" : undefined}
          />
        </label>
        {errors?.title && (
          <div className="pt-1 text-red-700" id="title-error">
            {errors.title}
          </div>
        )}
      </div>
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Category: </span>
          <select
            name="categoryId"
            required
            onChange={(e) => {
              setCategoryId(e.target.options[e.target.selectedIndex].value);
            }}
            defaultValue={categoryId || ""}
            aria-invalid={errors?.categoryId ? true : undefined}
            aria-errormessage={
              errors?.categoryId ? "categoryId-error" : undefined
            }
          >
            <option />
            {categoryList.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {errors?.categoryId && (
          <div className="pt-1 text-red-700" id="categoryId-error">
            {errors.categoryId}
          </div>
        )}
      </div>
      <div>
        <label>
          <span>Content: </span>
          <Editor defaultValue={initialData?.content} />
          {errors?.content && (
            <div className="pt-1 text-red-700" id="content-error">
              {errors.content}
            </div>
          )}
        </label>
      </div>
      <AnnounceOption
        defaultChecked={initialData?.announce}
        category={categoryList.find((c) => c.id === categoryId)}
      />
      <div>
        {initialData && initialData.published ? (
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        ) : (
          <Fragment>
            <button
              type="submit"
              name="published"
              value="true"
              className="btn btn-primary"
            >
              Publish
            </button>
            <button type="submit" className="btn">
              Save Draft
            </button>
          </Fragment>
        )}
      </div>
    </Form>
  );
}
