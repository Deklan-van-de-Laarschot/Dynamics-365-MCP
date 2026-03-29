import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerContactTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_contacts",
    "List contacts from Dynamics 365. Supports OData filtering, selecting fields, and sorting.",
    {
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records to return (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
      expand: z.string().optional().describe("OData $expand for related entities"),
    },
    async (params) => {
      const result = await client.list("contacts", {
        $filter: params.filter,
        $select: params.select || "fullname,firstname,lastname,emailaddress1,telephone1,jobtitle,parentcustomerid,statecode",
        $top: params.top || 50,
        $orderby: params.orderby,
        $expand: params.expand,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_contact",
    "Get a specific contact by ID from Dynamics 365",
    {
      id: z.string().describe("The contact GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("contacts", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_contact",
    "Create a new contact in Dynamics 365",
    {
      firstname: z.string().describe("First name"),
      lastname: z.string().describe("Last name"),
      emailaddress1: z.string().optional().describe("Primary email"),
      telephone1: z.string().optional().describe("Business phone"),
      mobilephone: z.string().optional().describe("Mobile phone"),
      jobtitle: z.string().optional().describe("Job title"),
      department: z.string().optional().describe("Department"),
      address1_line1: z.string().optional().describe("Street address"),
      address1_city: z.string().optional().describe("City"),
      address1_stateorprovince: z.string().optional().describe("State/Province"),
      address1_postalcode: z.string().optional().describe("Postal code"),
      address1_country: z.string().optional().describe("Country"),
      parentcustomerid_account: z.string().optional().describe("Parent account ID (GUID)"),
      description: z.string().optional().describe("Description/notes"),
    },
    async (params) => {
      const data: Record<string, unknown> = { ...params };
      if (params.parentcustomerid_account) {
        data["parentcustomerid_account@odata.bind"] = `/accounts(${params.parentcustomerid_account})`;
        delete data.parentcustomerid_account;
      }
      const result = await client.create("contacts", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_contact",
    "Update an existing contact in Dynamics 365",
    {
      id: z.string().describe("The contact GUID to update"),
      firstname: z.string().optional().describe("First name"),
      lastname: z.string().optional().describe("Last name"),
      emailaddress1: z.string().optional().describe("Primary email"),
      telephone1: z.string().optional().describe("Business phone"),
      mobilephone: z.string().optional().describe("Mobile phone"),
      jobtitle: z.string().optional().describe("Job title"),
      department: z.string().optional().describe("Department"),
      address1_line1: z.string().optional().describe("Street address"),
      address1_city: z.string().optional().describe("City"),
      address1_stateorprovince: z.string().optional().describe("State/Province"),
      address1_postalcode: z.string().optional().describe("Postal code"),
      address1_country: z.string().optional().describe("Country"),
      description: z.string().optional().describe("Description/notes"),
      ownerid: z.string().optional().describe("Owner (systemuser GUID) to reassign the contact to"),
    },
    async (params) => {
      const { id, ownerid, ...data } = params;
      if (ownerid) {
        (data as Record<string, unknown>)["ownerid@odata.bind"] = `/systemusers(${ownerid})`;
      }
      await client.update("contacts", id, data);
      return { content: [{ type: "text", text: `Contact ${id} updated successfully.` }] };
    }
  );

  server.tool(
    "delete_contact",
    "Delete a contact from Dynamics 365",
    {
      id: z.string().describe("The contact GUID to delete"),
    },
    async (params) => {
      await client.delete("contacts", params.id);
      return { content: [{ type: "text", text: `Contact ${params.id} deleted successfully.` }] };
    }
  );
}
