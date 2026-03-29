import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerOpportunityTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_opportunities",
    "List opportunities from Dynamics 365. Supports OData filtering, selecting fields, and sorting.",
    {
      filter: z.string().optional().describe("OData $filter expression (e.g., \"statecode eq 0\" for open)"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
      expand: z.string().optional().describe("OData $expand for related entities"),
    },
    async (params) => {
      const result = await client.list("opportunities", {
        $filter: params.filter,
        $select: params.select || "name,estimatedvalue,estimatedclosedate,stepname,statuscode,statecode,closeprobability,actualvalue,actualclosedate",
        $top: params.top || 50,
        $orderby: params.orderby,
        $expand: params.expand,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_opportunity",
    "Get a specific opportunity by ID from Dynamics 365",
    {
      id: z.string().describe("The opportunity GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("opportunities", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_opportunity",
    "Create a new opportunity in Dynamics 365",
    {
      name: z.string().describe("Opportunity name/topic"),
      customerid_account: z.string().optional().describe("Account ID (GUID) for the customer"),
      customerid_contact: z.string().optional().describe("Contact ID (GUID) for the customer"),
      estimatedvalue: z.number().optional().describe("Estimated revenue"),
      estimatedclosedate: z.string().optional().describe("Estimated close date (YYYY-MM-DD)"),
      closeprobability: z.number().optional().describe("Close probability (0-100)"),
      description: z.string().optional().describe("Description"),
      stepname: z.string().optional().describe("Sales stage name"),
      pricelevelid: z.string().optional().describe("Price list ID (GUID)"),
      transactioncurrencyid: z.string().optional().describe("Currency ID (GUID)"),
      parentaccountid: z.string().optional().describe("Parent account ID (GUID)"),
      parentcontactid: z.string().optional().describe("Parent contact ID (GUID)"),
    },
    async (params) => {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        switch (key) {
          case "customerid_account":
            data["customerid_account@odata.bind"] = `/accounts(${value})`;
            break;
          case "customerid_contact":
            data["customerid_contact@odata.bind"] = `/contacts(${value})`;
            break;
          case "pricelevelid":
            data["pricelevelid@odata.bind"] = `/pricelevels(${value})`;
            break;
          case "transactioncurrencyid":
            data["transactioncurrencyid@odata.bind"] = `/transactioncurrencies(${value})`;
            break;
          case "parentaccountid":
            data["parentaccountid@odata.bind"] = `/accounts(${value})`;
            break;
          case "parentcontactid":
            data["parentcontactid@odata.bind"] = `/contacts(${value})`;
            break;
          default:
            data[key] = value;
        }
      }
      const result = await client.create("opportunities", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_opportunity",
    "Update an existing opportunity in Dynamics 365",
    {
      id: z.string().describe("The opportunity GUID to update"),
      name: z.string().optional().describe("Opportunity name/topic"),
      estimatedvalue: z.number().optional().describe("Estimated revenue"),
      estimatedclosedate: z.string().optional().describe("Estimated close date (YYYY-MM-DD)"),
      closeprobability: z.number().optional().describe("Close probability (0-100)"),
      description: z.string().optional().describe("Description"),
      stepname: z.string().optional().describe("Sales stage name"),
    },
    async (params) => {
      const { id, ...data } = params;
      await client.update("opportunities", id, data);
      return { content: [{ type: "text", text: `Opportunity ${id} updated successfully.` }] };
    }
  );

  server.tool(
    "delete_opportunity",
    "Delete an opportunity from Dynamics 365",
    {
      id: z.string().describe("The opportunity GUID to delete"),
    },
    async (params) => {
      await client.delete("opportunities", params.id);
      return { content: [{ type: "text", text: `Opportunity ${params.id} deleted successfully.` }] };
    }
  );

  server.tool(
    "win_opportunity",
    "Close an opportunity as Won in Dynamics 365",
    {
      id: z.string().describe("The opportunity GUID to close as won"),
      actualvalue: z.number().optional().describe("Actual revenue value"),
      actualclosedate: z.string().optional().describe("Actual close date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Close description"),
    },
    async (params) => {
      const result = await client.executeAction("WinOpportunity", {
        OpportunityClose: {
          "opportunityid@odata.bind": `/opportunities(${params.id})`,
          actualend: params.actualclosedate || new Date().toISOString().split("T")[0],
          actualrevenue: params.actualvalue,
          description: params.description,
        },
        Status: 3,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "lose_opportunity",
    "Close an opportunity as Lost in Dynamics 365",
    {
      id: z.string().describe("The opportunity GUID to close as lost"),
      actualclosedate: z.string().optional().describe("Actual close date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Reason for loss"),
    },
    async (params) => {
      const result = await client.executeAction("LoseOpportunity", {
        OpportunityClose: {
          "opportunityid@odata.bind": `/opportunities(${params.id})`,
          actualend: params.actualclosedate || new Date().toISOString().split("T")[0],
          description: params.description,
        },
        Status: 4,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_opportunity_products",
    "List products/line items associated with an opportunity",
    {
      opportunityId: z.string().describe("The opportunity GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max records (default 50)"),
    },
    async (params) => {
      const result = await client.list("opportunityproducts", {
        $filter: `_opportunityid_value eq ${params.opportunityId}`,
        $select: params.select || "productdescription,priceperunit,quantity,extendedamount,baseamount",
        $top: params.top || 50,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_opportunity_product",
    "Add a product line item to an opportunity",
    {
      opportunityid: z.string().describe("Opportunity ID (GUID)"),
      productid: z.string().optional().describe("Product ID (GUID) - omit for write-in product"),
      quantity: z.number().describe("Quantity"),
      priceperunit: z.number().optional().describe("Price per unit (for write-in or override)"),
      description: z.string().optional().describe("Product description (for write-in)"),
      uomid: z.string().optional().describe("Unit of measure ID (GUID)"),
      isproductoverridden: z.boolean().optional().describe("True if this is a write-in product"),
      productdescription: z.string().optional().describe("Write-in product name"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        quantity: params.quantity,
      };
      data["opportunityid@odata.bind"] = `/opportunities(${params.opportunityid})`;
      if (params.productid) {
        data["productid@odata.bind"] = `/products(${params.productid})`;
      }
      if (params.uomid) {
        data["uomid@odata.bind"] = `/uoms(${params.uomid})`;
      }
      if (params.priceperunit !== undefined) data.priceperunit = params.priceperunit;
      if (params.description) data.description = params.description;
      if (params.isproductoverridden) data.isproductoverridden = params.isproductoverridden;
      if (params.productdescription) data.productdescription = params.productdescription;

      const result = await client.create("opportunityproducts", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
