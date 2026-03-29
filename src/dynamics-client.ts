import { DynamicsAuth } from "./auth.js";
import type { ODataListResponse, ODataQueryOptions } from "./types.js";

export class DynamicsClient {
  private auth: DynamicsAuth;
  private baseUrl: string;

  constructor(auth: DynamicsAuth, dynamicsUrl: string) {
    this.auth = auth;
    this.baseUrl = `${dynamicsUrl.replace(/\/$/, "")}/api/data/v9.2`;
  }

  private async request(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    headers?: Record<string, string>
  ): Promise<Response> {
    const token = await this.auth.getAccessToken();
    const url = path.startsWith("http") ? path : `${this.baseUrl}/${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: 'odata.include-annotations="*"',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Dynamics 365 API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response;
  }

  private buildQueryString(options?: ODataQueryOptions): string {
    if (!options) return "";
    const params = new URLSearchParams();
    if (options.$select) params.set("$select", options.$select);
    if (options.$filter) params.set("$filter", options.$filter);
    if (options.$expand) params.set("$expand", options.$expand);
    if (options.$top) params.set("$top", options.$top.toString());
    if (options.$orderby) params.set("$orderby", options.$orderby);
    if (options.$count) params.set("$count", "true");
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  async list(
    entitySet: string,
    options?: ODataQueryOptions
  ): Promise<ODataListResponse> {
    const qs = this.buildQueryString(options);
    const response = await this.request("GET", `${entitySet}${qs}`);
    return (await response.json()) as ODataListResponse;
  }

  async get(
    entitySet: string,
    id: string,
    select?: string
  ): Promise<Record<string, unknown>> {
    const qs = select ? `?$select=${select}` : "";
    const response = await this.request(
      "GET",
      `${entitySet}(${id})${qs}`
    );
    return (await response.json()) as Record<string, unknown>;
  }

  async create(
    entitySet: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const response = await this.request("POST", entitySet, data, {
      Prefer: "return=representation",
    });
    if (response.status === 204) {
      const entityId =
        response.headers.get("OData-EntityId") || "created";
      return { id: entityId };
    }
    return (await response.json()) as Record<string, unknown>;
  }

  async update(
    entitySet: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.request("PATCH", `${entitySet}(${id})`, data);
  }

  async delete(entitySet: string, id: string): Promise<void> {
    await this.request("DELETE", `${entitySet}(${id})`);
  }

  async executeAction(
    actionName: string,
    data?: Record<string, unknown>,
    entitySet?: string,
    id?: string
  ): Promise<Record<string, unknown>> {
    const path = entitySet && id
      ? `${entitySet}(${id})/Microsoft.Dynamics.CRM.${actionName}`
      : actionName;
    const response = await this.request("POST", path, data || {});
    if (response.status === 204) {
      return { success: true };
    }
    return (await response.json()) as Record<string, unknown>;
  }

  async executeFetchXml(
    entitySet: string,
    fetchXml: string
  ): Promise<ODataListResponse> {
    const encoded = encodeURIComponent(fetchXml);
    const response = await this.request(
      "GET",
      `${entitySet}?fetchXml=${encoded}`
    );
    return (await response.json()) as ODataListResponse;
  }

  async getNextPage(nextLink: string): Promise<ODataListResponse> {
    const response = await this.request("GET", nextLink);
    return (await response.json()) as ODataListResponse;
  }
}
