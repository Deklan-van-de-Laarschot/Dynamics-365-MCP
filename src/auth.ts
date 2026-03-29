interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export class DynamicsAuth {
  private tenantId: string;
  private clientId: string;
  private clientSecret: string;
  private dynamicsUrl: string;
  private cachedToken: CachedToken | null = null;

  constructor(config: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    dynamicsUrl: string;
  }) {
    this.tenantId = config.tenantId;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.dynamicsUrl = config.dynamicsUrl.replace(/\/$/, "");
  }

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60_000) {
      return this.cachedToken.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const scope = `${this.dynamicsUrl}/.default`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to acquire token: ${response.status} ${error}`);
    }

    const data = (await response.json()) as TokenResponse;

    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return this.cachedToken.accessToken;
  }
}
