import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerAccountTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_accounts",
    "List accounts from Dynamics 365. Supports OData filtering, selecting fields, and sorting.",
    {
      filter: z.string().optional().describe("OData $filter expression (e.g., \"revenue gt 1000000\")"),
      select: z.string().optional().describe("Comma-separated fields to return (e.g., \"name,accountnumber,revenue\")"),
      top: z.number().optional().describe("Max number of records to return (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression (e.g., \"name asc\")"),
      expand: z.string().optional().describe("OData $expand for related entities"),
    },
    async (params) => {
      const result = await client.list("accounts", {
        $filter: params.filter,
        $select: params.select || "name,accountnumber,revenue,telephone1,emailaddress1,websiteurl,statecode",
        $top: params.top || 50,
        $orderby: params.orderby,
        $expand: params.expand,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_account",
    "Get a specific account by ID from Dynamics 365",
    {
      id: z.string().describe("The account GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("accounts", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_account",
    "Create a new account in Dynamics 365",
    {
      name: z.string().describe("Account name"),
      accountnumber: z.string().optional().describe("Account number"),
      telephone1: z.string().optional().describe("Primary phone number"),
      emailaddress1: z.string().optional().describe("Primary email address"),
      websiteurl: z.string().optional().describe("Website URL"),
      address1_line1: z.string().optional().describe("Street address line 1"),
      address1_city: z.string().optional().describe("City"),
      address1_stateorprovince: z.string().optional().describe("State or province"),
      address1_postalcode: z.string().optional().describe("Postal code"),
      address1_country: z.string().optional().describe("Country"),
      revenue: z.number().optional().describe("Annual revenue"),
      numberofemployees: z.number().optional().describe("Number of employees"),
      description: z.string().optional().describe("Description"),
      industrycode: z.number().optional().describe("Industry code"),
      parentaccountid: z.string().optional().describe("Parent account ID (GUID) - sets lookup via @odata.bind"),
    },
    async (params) => {
      const data: Record<string, unknown> = { ...params };
      if (params.parentaccountid) {
        data["parentaccountid@odata.bind"] = `/accounts(${params.parentaccountid})`;
        delete data.parentaccountid;
      }
      const result = await client.create("accounts", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_account",
    "Update an existing account in Dynamics 365",
    {
      id: z.string().describe("The account GUID to update"),
      name: z.string().optional().describe("Account name"),
      accountnumber: z.string().optional().describe("Account number"),
      telephone1: z.string().optional().describe("Primary phone number"),
      emailaddress1: z.string().optional().describe("Primary email address"),
      websiteurl: z.string().optional().describe("Website URL"),
      address1_line1: z.string().optional().describe("Street address line 1"),
      address1_city: z.string().optional().describe("City"),
      address1_stateorprovince: z.string().optional().describe("State or province"),
      address1_postalcode: z.string().optional().describe("Postal code"),
      address1_country: z.string().optional().describe("Country"),
      revenue: z.number().optional().describe("Annual revenue"),
      numberofemployees: z.number().optional().describe("Number of employees"),
      description: z.string().optional().describe("Description"),
      ownerid: z.string().optional().describe("Owner (systemuser GUID) to reassign the account to"),
    },
    async (params) => {
      const { id, ownerid, ...data } = params;
      if (ownerid) {
        (data as Record<string, unknown>)["ownerid@odata.bind"] = `/systemusers(${ownerid})`;
      }
      await client.update("accounts", id, data);
      return { content: [{ type: "text", text: `Account ${id} updated successfully.` }] };
    }
  );

  server.tool(
    "delete_account",
    "Delete an account from Dynamics 365",
    {
      id: z.string().describe("The account GUID to delete"),
    },
    async (params) => {
      await client.delete("accounts", params.id);
      return { content: [{ type: "text", text: `Account ${params.id} deleted successfully.` }] };
    }
  );
}
