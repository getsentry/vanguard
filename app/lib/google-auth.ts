// Modified from https://github.com/pbteja1998/remix-auth-google to
// include `hd` prompt

// MIT License

// Copyright (c) 2022 Functional Software, Inc.
// Copyright (c) 2021 Sergio Xalambrí

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import type { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";
import { OAuth2Strategy } from "remix-auth-oauth2";

export type GoogleStrategyOptions = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  /**
   * @default "openid profile email"
   */
  scope?: string;
  accessType?: "online" | "offline";
  includeGrantedScopes?: boolean;
  prompt?: "none" | "consent" | "select_account";
  hd?: string;
};

export type GoogleProfile = {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: [{ value: string }];
  photos: [{ value: string }];
  _json: {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    locale: string;
    email: string;
    email_verified: boolean;
    hd: string;
  };
} & OAuth2Profile;

export type GoogleExtraParams = {
  expires_in: 3920;
  token_type: "Bearer";
  scope: string;
  id_token: string;
} & Record<string, string | number>;

export class GoogleStrategy<User> extends OAuth2Strategy<
  User,
  GoogleProfile,
  GoogleExtraParams
> {
  public name = "google";

  private readonly scope: string;

  private readonly accessType: string;

  private readonly prompt?: "none" | "consent" | "select_account";

  private readonly hd?: string;

  private readonly includeGrantedScopes: boolean;

  private readonly userInfoURL =
    "https://www.googleapis.com/oauth2/v3/userinfo";

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      accessType,
      includeGrantedScopes,
      prompt,
      hd,
    }: GoogleStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<GoogleProfile, GoogleExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenURL: "https://oauth2.googleapis.com/token",
      },
      verify
    );
    this.scope = scope ?? "openid profile email";
    this.accessType = accessType ?? "online";
    this.includeGrantedScopes = includeGrantedScopes ?? false;
    this.prompt = prompt;
    this.hd = hd;
  }

  protected authorizationParams(): URLSearchParams {
    const params = new URLSearchParams({
      scope: this.scope,
      access_type: this.accessType,
      include_granted_scopes: String(this.includeGrantedScopes),
    });
    if (this.prompt) {
      params.set("prompt", this.prompt);
    }
    if (this.hd) {
      params.set("hd", this.hd);
    }
    return params;
  }

  protected async userProfile(accessToken: string): Promise<GoogleProfile> {
    const response = await fetch(this.userInfoURL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const raw: GoogleProfile["_json"] = await response.json();
    const profile: GoogleProfile = {
      provider: "google",
      id: raw.sub,
      displayName: raw.name,
      name: {
        familyName: raw.family_name,
        givenName: raw.given_name,
      },
      emails: [{ value: raw.email }],
      photos: [{ value: raw.picture }],
      _json: raw,
    };
    return profile;
  }
}
