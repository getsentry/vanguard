type Variant = "development" | "preview";

const variants: Record<Variant, { background: string; text: string }> = {
  development: {
    background: "#dc2626", // red-600
    text: "Vanguard is running in development mode.",
  },
  preview: {
    background: "#b45309", // amber-700
    text: "Preview deploy — auto-logged in as Preview Admin. Database changes are scoped to this branch and are not permanent.",
  },
};

export default function EnvNotice({ variant = "development" }: { variant?: Variant }) {
  const { background, text } = variants[variant];
  return (
    <div>
      <div
        style={{
          color: "white",
          background,
          textAlign: "center",
          fontWeight: "bold",
          width: "100%",
          zIndex: 100,
          position: "absolute",
          padding: "0.75rem",
        }}
      >
        {text}
      </div>
      <div style={{ visibility: "hidden", padding: "0.75rem" }}>Text</div>
    </div>
  );
}
