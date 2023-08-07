export default function DevNotice() {
  return (
    <div>
      <div
        style={{
          color: "white",
          background: "red",
          textAlign: "center",
          fontWeight: "bold",
          width: "100%",
          zIndex: 100,
          position: "absolute",
          padding: "0.75rem",
        }}
      >
        Vanguard is running in development mode.
      </div>
      <div style={{ visibility: "hidden", padding: "0.75rem" }}>Text</div>
    </div>
  );
}
