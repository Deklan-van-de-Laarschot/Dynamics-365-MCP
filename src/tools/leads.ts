import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerLeadTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_leads",
    "List leads from Dynamics 365. Supports OData filtering, selecting fields, and sorting.",
    {
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
    },
    async (params) => {
      const result = await client.list("leads", {
        $filter: params.filter,
        $select: params.select || "fullname,firstname,lastname,emailaddress1,telephone1,companyname,jobtitle,subject,leadqualitycode,statuscode,statecode,estimatedvalue,estimatedclosedate",
        $top: params.top || 50,
        $orderby: params.orderby,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_lead",
    "Get a specific lead by ID from Dynamics 365",
    {
      id: z.string().describe("The lead GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("leads", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_lead",
    "Create a new lead in Dynamics 365",
    {
      firstname: z.string().optional().describe("First name"),
      lastname: z.string().describe("Last name"),
      emailaddress1: z.string().optional().describe("Email"),
      telephone1: z.string().optional().describe("Business phone"),
      companyname: z.string().optional().describe("Company name"),
      jobtitle: z.string().optional().describe("Job title"),
      subject: z.string().optional().describe("Topic/subject of the lead"),
      description: z.string().optional().describe("Description"),
      estimatedvalue: z.number().optional().describe("Estimated value"),
      estimatedclosedate: z.string().optional().describe("Estimated close date (YYYY-MM-DD)"),
      leadsourcecode: z.number().optional().describe("Lead source code (1=Advertisement, 2=Employee Referral, etc.)"),
      leadqualitycode: z.number().optional().describe("Lead quality (1=Hot, 2=Warm, 3=Cold)"),
      address1_line1: z.string().optional().describe("Street address"),
      address1_city: z.string().optional().describe("City"),
      address1_stateorprovince: z.string().optional().describe("State/Province"),
      address1_postalcode: z.string().optional().describe("Postal code"),
      address1_country: z.string().optional().describe("Country"),
    },
    async (params) => {
      const result = await client.create("leads", params);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_lead",
    "Update an existing lead in Dynamics 365",
    {
      id: z.string().describe("The lead GUID to update"),
      firstname: z.string().optional().describe("First name"),
      lastname: z.string().optional().describe("Last name"),
      emailaddress1: z.string().optional().describe("Email"),
      telephone1: z.string().optional().describe("Business phone"),
      companyname: z.string().optional().describe("Company name"),
      jobtitle: z.string().optional().describe("Job title"),
      subject: z.string().optional().describe("Topic/subject"),
      description: z.string().optional().describe("Description"),
      estimatedvalue: z.number().optional().describe("Estimated value"),
      estimatedclosedate: z.string().optional().describe("Estimated close date (YYYY-MM-DD)"),
      leadqualitycode: z.number().optional().describe("Lead quality (1=Hot, 2=Warm, 3=Cold)"),
    },
    async (params) => {
      const { id, ...data } = params;
      await client.update("leads", id, data);
      return { content: [{ type: "text", text: `Lead ${id} updated successfully.` }] };
    }
  );

  server.tool(
    "delete_lead",
    "Delete a lead from Dynamics 365",
    {
      id: z.string().describe("The lead GUID to delete"),
    },
    async (params) => {
      await client.delete("leads", params.id);
      return { content: [{ type: "text", text: `Lead ${params.id} deleted successfully.` }] };
    }
  );

  server.tool(
    "qualify_lead",
    "Qualify a lead in Dynamics 365 - converts it to an account, contact, and/or opportunity",
    {
      id: z.string().describe("The lead GUID to qualify"),
      createAccount: z.boolean().optional().describe("Create an account (default true)"),
      createContact: z.boolean().optional().describe("Create a contact (default true)"),
      createOpportunity: z.boolean().optional().describe("Create an opportunity (default true)"),
      status: z.number().optional().describe("Status code for qualification (default 3 = Qualified)"),
    },
    async (params) => {
      const result = await client.executeAction(
        "QualifyLead",
        {
          CreateAccount: params.createAccount ?? true,
          CreateContact: params.createContact ?? true,
          CreateOpportunity: params.createOpportunity ?? true,
          Status: params.status ?? 3,
        },
        "leads",
        params.id
      );
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
