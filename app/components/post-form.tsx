import { Fragment, useRef, useState } from "react";
import { Form } from "@remix-run/react";

import type { Category } from "../models/category.server";
import Editor from "./editor";
import useLocalStorage from "~/lib/useLocalStorage";
import styled from "styled-components";
import Button from "./button";
import ButtonGroup from "./button-group";
import ButtonDropdown, { ButtonDropdownItem } from "./button-dropdown";

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

const HelpText = styled.div`
  font-size: 0.7em;
  color: #999;
`;

const PostFormButtons = styled.div`
  position: fixed;
  background: #eee;
  padding: 1.5rem 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const PostFormButtonsWrapper = styled.div`
  margin-right: 40rem;
  text-align: right;
`;

export default function PostForm({
  categoryList,
  errors,
  initialData,
  canDelete = false,
  canUnpublish = false,
  canAnnounce = true,
}: {
  categoryList: Category[];
  errors?: PostFormErrors;
  initialData?: PostFormInitialData;
  canDelete?: boolean;
  canUnpublish?: boolean;
  canAnnounce?: boolean;
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
      <PostFormButtons>
        <PostFormButtonsWrapper>
          <div className="container">
            <ButtonGroup>
              {initialData && initialData.published ? (
                canUnpublish && initialData.published ? (
                  <ButtonDropdown type="submit" mode="primary" label="Save">
                    <ButtonDropdownItem
                      type="submit"
                      name="published"
                      value="false"
                    >
                      Save as Draft
                      <HelpText>Unpublish this post.</HelpText>
                    </ButtonDropdownItem>
                    <ButtonDropdownItem
                      type="submit"
                      name="published"
                      value="true"
                    >
                      Save as Published
                      <HelpText>Just save changes.</HelpText>
                    </ButtonDropdownItem>
                  </ButtonDropdown>
                ) : (
                  <Button type="submit" mode="primary">
                    Save
                  </Button>
                )
              ) : canAnnounce ? (
                <Fragment>
                  <ButtonDropdown
                    type="submit"
                    mode="primary"
                    name="published"
                    value="announce"
                    label="Publish"
                  >
                    <ButtonDropdownItem
                      type="submit"
                      name="published"
                      value="announce"
                    >
                      Publish
                    </ButtonDropdownItem>
                    <ButtonDropdownItem
                      type="submit"
                      name="published"
                      value="true"
                    >
                      Publish Silently
                      <HelpText>
                        Don't send announcements (if configured).
                      </HelpText>
                    </ButtonDropdownItem>
                  </ButtonDropdown>
                  <Button type="submit">Save Draft</Button>
                </Fragment>
              ) : (
                <Button type="submit" name="published" value="true">
                  Publish
                </Button>
              )}
              {canDelete && (
                <Button type="submit" name="deleted" value="true" mode="danger">
                  Delete
                </Button>
              )}
            </ButtonGroup>
          </div>
        </PostFormButtonsWrapper>
      </PostFormButtons>
    </Form>
  );
}
