export interface ODataListResponse<T = Record<string, unknown>> {
  "@odata.context"?: string;
  "@odata.count"?: number;
  "@odata.nextLink"?: string;
  value: T[];
}

export interface ODataQueryOptions {
  $select?: string;
  $filter?: string;
  $expand?: string;
  $top?: number;
  $orderby?: string;
  $count?: boolean;
}

export interface DynamicsConfig {
  dynamicsUrl: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
}
