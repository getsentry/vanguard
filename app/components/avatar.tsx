export default function Avatar({
  user,
  size = "3rem",
  ...props
}: {
  size?: string;
  user?: { picture?: string | null };
}) {
  return (
    <img
      src={user?.picture || "/img/placeholder-avatar.png"}
      alt="avatar"
      style={{
        display: "block",
        width: size,
        height: size,
        borderRadius: size,
        objectFit: "cover",
      }}
      {...props}
    />
  );
}
