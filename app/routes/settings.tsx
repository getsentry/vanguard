import React, { useEffect, useRef, useState } from "react";
import {
  ActionFunction,
  LoaderFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

import { requireUser, requireUserId } from "~/session.server";
import { updateUser, User } from "~/models/user.server";
import uploadHandler from "~/lib/upload-handler";
import styled from "styled-components";
import { UploadIcon } from "@radix-ui/react-icons";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  return json<LoaderData>({ user });
};

type ActionData = {
  errors?: {
    name?: string;
    picture?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const filter = ({ mimetype }: { mimetype: string }) => {
    return /image/i.test(mimetype);
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler({
      fieldName: "picture",
      filter,
      namespace: userId,
      urlPrefix: "/image-uploads",
    })
  );
  const name = formData.get("name");
  const picture = formData.get("picture");

  if (typeof name !== "string" || name.length === 0) {
    return json<ActionData>(
      { errors: { name: "Name is required" } },
      { status: 400 }
    );
  }

  await updateUser({
    userId,
    id: userId,
    name,
    picture,
  });

  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirectTo");
  if (redirectTo?.indexOf("/") !== 0) redirectTo = "/";
  return redirect(redirectTo);
};

export default function NewPostPage() {
  const { user } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;
  const errors = actionData?.errors;

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors?.name) {
      nameRef.current?.focus();
    }
  }, [errors]);

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      className="p-4"
    >
      <h1>Edit Profile</h1>
      <div>
        <label>
          <span>What should we call you?</span>
          <input
            ref={nameRef}
            type="text"
            name="name"
            required
            placeholder="Jane Doe"
            autoFocus
            defaultValue={user.name || ""}
            aria-invalid={errors?.name ? true : undefined}
            aria-errormessage={errors?.name ? "name-error" : undefined}
          />
        </label>
        {errors?.name && (
          <div className="pt-1 text-red-700" id="name-error">
            {errors.name}
          </div>
        )}
      </div>
      <div>
        <label>
          <span>How about a slick way to visually identify yourself?</span>
          <StyledAvatarInput
            initialValue={user.picture}
            name="picture"
            error={errors?.picture}
          />
        </label>
        {errors?.picture && (
          <div className="pt-1 text-red-700" id="picture-error">
            {errors.picture}
          </div>
        )}
      </div>
      <div>
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </div>
    </Form>
  );
}

const AvatarInput: React.FC<{
  initialValue?: string | null;
  error?: string;
  name: string;
  className?: string;
}> = ({ className, initialValue, error, name }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrag, setDrag] = useState(false);

  const updatePreview = () => {
    const file = Array.from(fileRef.current!.files).find(() => true);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageRef.current!.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      imageRef.current!.src = "";
    }
  };
  return (
    <div
      className={className}
      // dragover and dragenter events need to have 'preventDefault' called
      // in order for the 'drop' event to register.
      // See: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Drag_operations#droptargets
      // https://stackoverflow.com/questions/8006715/drag-drop-files-into-standard-html-file-input
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragExit={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onMouseOver={(e) => {
        setDrag(true);
      }}
      onMouseOut={(e) => {
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const dt = new DataTransfer();
        Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
        fileRef.current!.files = dt.files;
        updatePreview();
      }}
    >
      <StyledAvatarInputDropBox show={isDrag}>
        <UploadIcon width="64" height="64" />
      </StyledAvatarInputDropBox>
      <img src={initialValue || ""} alt="avatar" ref={imageRef} />
      <input
        ref={fileRef}
        type="file"
        name={name}
        accept="image/*"
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? "picture-error" : undefined}
        onChange={(e) => {
          e.preventDefault();
          updatePreview();
        }}
      />
      <p>
        Want to{" "}
        <button
          onClick={(e) => {
            e.preventDefault();
            fileRef.current?.click();
          }}
        >
          change your picture
        </button>
        ?
      </p>
    </div>
  );
};

const StyledAvatarInputDropBox = styled.div`
  display: ${(p) => (p.show ? "flex" : "none")};
  cursor: pointer;
  opacity: 0.85;
  background: #fff;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`;

const StyledAvatarInput = styled(AvatarInput)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  background: ${(p) => p.theme.bgColor};
  border: 1px solid ${(p) => p.theme.borderColor};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: "Inter", sans-serif;

  > input[type="file"] {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    cursor: pointer;
  }

  img,
  p {
    flex: 1;
    margin: 0;
  }

  button {
    color: ${(p) => p.theme.linkColor};
  }
`;
