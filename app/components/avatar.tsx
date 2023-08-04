import type { User } from "@prisma/client";
export default function Avatar({
  user,
  size = "4.8rem",
  ...props
}: {
  size?: string;
  user: User;
}) {
  return (
    <img
      src={user.picture || "/img/placeholder-avatar.png"}
      alt="avatar"
      style={{
        display: "block",
        width: size,
        height: size,
        borderRadius: "4.8rem",
        objectFit: "cover",
      }}
      {...props}
    />
  );
}
