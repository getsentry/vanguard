import type { ReactNode } from "react";

export default function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 p-4">
      <div className="flex">
        <div className="ml-3 text-red-500">{children}</div>
      </div>
    </div>
  );
}
