import type { User } from "@prisma/client";
import styled from "styled-components";

export default styled(({ user, ...props }: { user: User }) => {
  return (
    <img
      src={user.picture || "/img/placeholder-avatar.png"}
      alt="avatar"
      {...props}
    />
  );
})`
  display: block;
  width: ${(p) => (p.size ? p.size : "4.8rem")};
  height: ${(p) => (p.size ? p.size : "4.8rem")};
  border-radius: 4.8rem;
`;
