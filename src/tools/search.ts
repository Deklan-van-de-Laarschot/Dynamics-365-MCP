import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerSearchTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "search_records",
    "Search Dynamics 365 records across any entity using OData query options. Use this for custom queries.",
    {
      entitySet: z.string().describe("Entity set name (e.g., 'accounts', 'contacts', 'opportunities', 'leads', 'salesorders', 'invoices', 'quotes', 'products', 'tasks', 'emails', 'appointments', 'phonecalls')"),
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      expand: z.string().optional().describe("OData $expand for related entities"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
      count: z.boolean().optional().describe("Include total count in response"),
    },
    async (params) => {
      const result = await client.list(params.entitySet, {
        $filter: params.filter,
        $select: params.select,
        $expand: params.expand,
        $top: params.top || 50,
        $orderby: params.orderby,
        $count: params.count,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "execute_fetchxml",
    "Execute a FetchXML query against Dynamics 365. FetchXML supports complex joins, aggregations, and grouping.",
    {
      entitySet: z.string().describe("Entity set name to query against (e.g., 'accounts', 'contacts')"),
      fetchXml: z.string().describe("The FetchXML query string"),
    },
    async (params) => {
      const result = await client.executeFetchXml(params.entitySet, params.fetchXml);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_next_page",
    "Retrieve the next page of results using an @odata.nextLink URL from a previous query",
    {
      nextLink: z.string().describe("The @odata.nextLink URL from a previous query response"),
    },
    async (params) => {
      const result = await client.getNextPage(params.nextLink);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
