import { useEffect, useRef, useState } from "react";
import { Form } from "@remix-run/react";

import type { Category } from "../models/category.server";
import type { Feed } from "../models/feed.server";
import Editor from "./editor";
import useLocalStorage from "~/lib/useLocalStorage";
import Button from "./button";
import ButtonGroup from "./button-group";
import ButtonDropdown, { ButtonDropdownItem } from "./button-dropdown";
import FormActions from "./form-actions";
import { categoryTagStyles } from "./category-tag";
import HelpText from "./help-text";

export type PostFormErrors = {
  title?: string;
  content?: string;
  categoryId?: string;
  meta?: { [name: string]: string };
  feedId?: string;
};

export type PostFormInitialData = {
  title?: string;
  content?: string;
  categoryId?: string;
  published?: boolean;
  announce?: boolean;
  feedIds?: string[];
  meta?: { [name: string]: string };
};

const CategorySelector = ({
  name,
  categoryList,
  defaultValue = "",
  error,
  onChange,
}: {
  name: string;
  categoryList: Category[];
  defaultValue?: string | null;
  error?: string;
  onChange: (e: any, value: string) => void;
}) => {
  const [categoryId, setCategoryId] = useState(defaultValue);

  useEffect(() => {
    setCategoryId(defaultValue);
  }, [defaultValue]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {categoryList.map((category) => (
          <label
            className="font-mono cursor-pointer flex flex-row text-sm items-center gap-2 px-4 py-2 rounded-full uppercase border border-border-light dark:border-border-dark"
            key={category.id}
            style={
              category.id === categoryId
                ? categoryTagStyles(category.colorHex)
                : undefined
            }
          >
            <input
              type="radio"
              name={name}
              value={category.id}
              checked={category.id === categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                onChange(e, e.target.value);
              }}
            />
            {category.name}
          </label>
        ))}
      </div>
    </>
  );
};

const MetaConfigField = ({
  name,
  required,
  description,
  defaultValue,
  error,
}: {
  name: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
  error?: string;
}) => {
  return (
    <div>
      <label className={required ? "field-required" : ""}>
        <span>{name}: </span>
        <input
          name={`meta[${name}]`}
          required={required}
          defaultValue={defaultValue}
        />
        {description && <HelpText>{description}</HelpText>}
      </label>
      {error && (
        <div className="pt-1 text-red-700" id="content-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default function PostForm({
  categoryList,
  feedList,
  errors,
  initialData,
  canDelete = false,
  canUnpublish = false,
  canAnnounce = true,
}: {
  categoryList: Category[];
  feedList: Feed[];
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
    initialData?.categoryId || categoryList.find(() => true)?.id || null,
  );

  const selectedCategory = categoryList.find((c) => c.id === categoryId);

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
        const match = e.target.name.match(/^meta\[(.+)\]$/);
        const value = e.target.value;
        const additions = match
          ? { meta: { ...(storedDraft.meta || {}), [match[1]]: value } }
          : { [e.target.name]: value };
        setStoredDraft({ ...storedDraft, ...additions });
      }}
    >
      <input type="hidden" name="action" value="update" />
      <div>
        <label className="field-required">
          <span>Title:</span>
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
        <label className="field-required">
          <span>Category:</span>
          <CategorySelector
            name="categoryId"
            categoryList={categoryList}
            defaultValue={categoryId}
            error={errors?.categoryId}
            onChange={(e, value) => {
              setCategoryId(value);
            }}
          />
        </label>
        {errors?.categoryId && (
          <div className="pt-1 text-red-700" id="categoryId-error">
            {errors.categoryId}
          </div>
        )}
        {selectedCategory?.description && (
          <div className="-mt-6 mb-6">
            <HelpText>{selectedCategory.description}</HelpText>
          </div>
        )}
      </div>
      {selectedCategory?.metaConfig.map((meta) => (
        <MetaConfigField
          key={meta.id}
          required={meta.required}
          name={meta.name}
          defaultValue={initialData?.meta?.[meta.name]}
          description={meta.description}
          error={errors?.meta?.[meta.name]}
        />
      ))}
      <div>
        <label className="field-required">
          <span>Content:</span>
          <Editor name="content" defaultValue={initialData?.content} />
        </label>
        {errors?.content && (
          <div className="pt-1 text-red-700" id="content-error">
            {errors.content}
          </div>
        )}
      </div>
      {!!feedList.length && (
        <>
          <h6>Syndication</h6>
          <ul>
            {feedList.map((feed) => (
              <li key={feed.id}>
                <div>
                  <label className="field-inline">
                    <input
                      type="checkbox"
                      name="feedId"
                      value={feed.id}
                      defaultChecked={
                        initialData?.feedIds &&
                        initialData?.feedIds?.indexOf(feed.id) !== -1
                      }
                    />
                    Publish to{" "}
                    {feed.url ? <a href={feed.url}>{feed.name}</a> : feed.name}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <FormActions>
        <ButtonGroup>
          {initialData && initialData.published ? (
            canUnpublish && initialData.published ? (
              <ButtonDropdown type="submit" mode="primary" label="Save Changes">
                <ButtonDropdownItem
                  type="submit"
                  name="published"
                  value="false"
                >
                  Save as Draft
                  <HelpText>Unpublish this post.</HelpText>
                </ButtonDropdownItem>
                <ButtonDropdownItem type="submit" name="published" value="true">
                  Save as Published
                  <HelpText>Just save changes.</HelpText>
                </ButtonDropdownItem>
              </ButtonDropdown>
            ) : (
              <Button type="submit" mode="primary">
                Save Changes
              </Button>
            )
          ) : (
            <Button type="submit" mode="primary" name="published" value="false">
              Save Draft
            </Button>
          )}
          {canDelete && (
            <Button type="submit" name="deleted" value="true" mode="danger">
              Delete
            </Button>
          )}
        </ButtonGroup>
      </FormActions>
    </Form>
  );
}
