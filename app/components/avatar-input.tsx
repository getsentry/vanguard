import React, { useRef, useState } from "react";

import styled from "styled-components";
import { UploadIcon } from "@radix-ui/react-icons";

const UnstyledAvatarInput: React.FC<{
  initialValue?: string | null;
  error?: string;
  name: string;
  className?: string;
  required?: boolean;
}> = ({ className, initialValue, error, name, required }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isHover, setHover] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(initialValue || null);

  const updatePreview = () => {
    const file = Array.from(fileRef.current!.files).find(() => true);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
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
        setHover(true);
      }}
      onDragExit={(e) => {
        e.preventDefault();
        setHover(false);
      }}
      onMouseOver={(e) => {
        setHover(true);
      }}
      onMouseOut={(e) => {
        setHover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const dt = new DataTransfer();
        Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
        fileRef.current!.files = dt.files;
        updatePreview();
      }}
    >
      <DropZone show={isHover}>
        <UploadIcon width="64" height="64" />
      </DropZone>
      {imageSrc && <img src={imageSrc} alt="avatar" ref={imageRef} />}
      <input
        ref={fileRef}
        type="file"
        name={name}
        accept="image/*"
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? "picture-error" : undefined}
        required={required}
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

const DropZone = styled.div`
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

const AvatarInput = styled(UnstyledAvatarInput)`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  background: ${(p) => p.theme.bgColor};
  border: 1px solid ${(p) => p.theme.borderColor};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: "Inter", sans-serif;
  min-height: 5em;

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
    margin: 0;
  }

  p {
    text-align: center;
    vertical-align: center;
  }

  button {
    color: ${(p) => p.theme.linkColor};
  }
`;

export default AvatarInput;
