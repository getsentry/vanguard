import { useRef, useState } from "react";
import { UploadIcon } from "@radix-ui/react-icons";

import classNames from "~/lib/classNames";

export default function AvatarInput({
  initialValue,
  error,
  name,
  required,
}: {
  initialValue?: string | null;
  error?: string;
  name: string;
  required?: boolean;
}) {
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
      className="relative flex flex-col justify-center items-center gap-2 bg-bg-light dark:bg-bg-dark border:border-border-light dark:border-border-dark border px-4 py-2 rounded min-h-[5rem]"
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
      <div
        className={classNames(
          "cursor-pointer opacity-80 bg-bg-light dark:bg-bg-dark absolute inset-0 items-center justify-center",
          isHover ? "flex" : "hidden",
        )}
      >
        <UploadIcon width="64" height="64" />
      </div>
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
        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
      />
      <p className="text-center">
        Want to{" "}
        <button
          className="text-link-light dark:text-link-dark"
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
}
