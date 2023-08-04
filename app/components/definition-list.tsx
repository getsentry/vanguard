import type { ComponentPropsWithoutRef } from "react";

export default function DefinitionList(props: ComponentPropsWithoutRef<"dl">) {
  return <dl className="flex flex-wrap" {...props} />;
}

DefinitionList.Term = function Term(props: ComponentPropsWithoutRef<"dt">) {
  return <dt className="my-1 basis-[20%] pr-1 bold" {...props} />;
};

DefinitionList.Desc = function Desc(props: ComponentPropsWithoutRef<"dd">) {
  return <dt className="my-1 basis-[70%] flex-grow" {...props} />;
};
