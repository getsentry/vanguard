import type { LoaderFunctionArgs } from "react-router";
import { Form, redirect, useLoaderData } from "react-router";

import Button from "~/components/button";
import Link from "~/components/link";
import { previewAutoLoginEnabled } from "~/services/preview-auto-login.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirectTo");
  if (!redirectTo || redirectTo?.indexOf("/") !== 0) redirectTo = "/";

  // On Vercel Preview deploys with PREVIEW_AUTO_LOGIN=1, auth is bypassed and
  // the user is already "signed in" as the seeded Preview Admin — skip the
  // login page entirely.
  if (previewAutoLoginEnabled) throw redirect(redirectTo);

  return { redirectTo };
}

export default function Login() {
  const { redirectTo } = useLoaderData<typeof loader>();
  return (
    <div className="max-w-sm mx-auto my-24">
      <div className="flex flex-grow items-center justify-center px-4">
        <h1 className="text-4xl font-serif">Login to Continue</h1>
      </div>

      <div className="min-w-sm mt-8 flex-1">
        <Form
          action={`/auth/google?redirectTo=${redirectTo}`}
          method="post"
          className="flex justify-center"
        >
          <Button mode="primary">
            <svg
              className="-ml-1 mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              ></path>
            </svg>
            Sign in with Google
          </Button>
        </Form>
      </div>
      <div className="mt-6 text-center text-xs">
        <Link to="/about">About Vanguard</Link>
      </div>
    </div>
  );
}
