import * as styles from "./dev-notice.css";

export default function DevNotice() {
  return (
    <div>
      <div className={styles.message}>
        Vanguard is running in development mode.
      </div>
      <div style={{ visibility: "hidden", padding: "0.75rem" }}>Text</div>
    </div>
  );
}
