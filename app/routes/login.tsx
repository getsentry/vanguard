import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import Button from "~/components/button";

type LoaderData = {
  redirectTo?: string;
};

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirectTo");
  if (!redirectTo || redirectTo?.indexOf("/") !== 0) redirectTo = "/";

  return json<LoaderData>({ redirectTo });
};

export default function Login() {
  const { redirectTo } = useLoaderData();
  return (
    <Form action={`/auth/google?redirectTo=${redirectTo}`} method="post">
      <Button>Login with Google</Button>
    </Form>
  );
}
