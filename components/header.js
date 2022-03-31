import { useAuth } from "../lib/auth";

export default function Header({ children }) {
  const user = useAuth();

  return <header>You are logged in as {user.email}</header>;
}
