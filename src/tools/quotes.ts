import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerQuoteTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_quotes",
    "List quotes from Dynamics 365",
    {
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
    },
    async (params) => {
      const result = await client.list("quotes", {
        $filter: params.filter,
        $select: params.select || "name,quotenumber,totalamount,statecode,statuscode,effectivefrom,effectiveto,description",
        $top: params.top || 50,
        $orderby: params.orderby,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_quote",
    "Get a specific quote by ID from Dynamics 365",
    {
      id: z.string().describe("The quote GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("quotes", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_quote",
    "Create a new quote in Dynamics 365",
    {
      name: z.string().describe("Quote name/title"),
      opportunityid: z.string().optional().describe("Opportunity ID (GUID) to link this quote to"),
      customerid_account: z.string().optional().describe("Customer account ID (GUID)"),
      customerid_contact: z.string().optional().describe("Customer contact ID (GUID)"),
      pricelevelid: z.string().optional().describe("Price list ID (GUID)"),
      description: z.string().optional().describe("Quote description"),
      effectivefrom: z.string().optional().describe("Valid from date (YYYY-MM-DD)"),
      effectiveto: z.string().optional().describe("Valid to date (YYYY-MM-DD)"),
      discountpercentage: z.number().optional().describe("Discount percentage"),
      discountamount: z.number().optional().describe("Discount amount"),
      freightamount: z.number().optional().describe("Freight/shipping amount"),
      paymenttermscode: z.number().optional().describe("Payment terms code"),
      shippingmethodcode: z.number().optional().describe("Shipping method code"),
      billto_name: z.string().optional().describe("Bill to name"),
      billto_line1: z.string().optional().describe("Bill to address line 1"),
      billto_city: z.string().optional().describe("Bill to city"),
      billto_stateorprovince: z.string().optional().describe("Bill to state/province"),
      billto_postalcode: z.string().optional().describe("Bill to postal code"),
      billto_country: z.string().optional().describe("Bill to country"),
      shipto_name: z.string().optional().describe("Ship to name"),
      shipto_line1: z.string().optional().describe("Ship to address line 1"),
      shipto_city: z.string().optional().describe("Ship to city"),
      shipto_stateorprovince: z.string().optional().describe("Ship to state/province"),
      shipto_postalcode: z.string().optional().describe("Ship to postal code"),
      shipto_country: z.string().optional().describe("Ship to country"),
      transactioncurrencyid: z.string().optional().describe("Currency ID (GUID)"),
    },
    async (params) => {
      const data: Record<string, unknown> = {};
      const lookups: Record<string, string> = {
        opportunityid: "opportunities",
        customerid_account: "accounts",
        customerid_contact: "contacts",
        pricelevelid: "pricelevels",
        transactioncurrencyid: "transactioncurrencies",
      };
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        if (lookups[key]) {
          data[`${key}@odata.bind`] = `/${lookups[key]}(${value})`;
        } else {
          data[key] = value;
        }
      }
      const result = await client.create("quotes", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_quote_detail",
    "Add a product line item to a quote",
    {
      quoteid: z.string().describe("Quote ID (GUID)"),
      productid: z.string().optional().describe("Product ID (GUID) - omit for write-in"),
      quantity: z.number().describe("Quantity"),
      priceperunit: z.number().optional().describe("Price per unit"),
      uomid: z.string().optional().describe("Unit of measure ID (GUID)"),
      description: z.string().optional().describe("Line item description"),
      isproductoverridden: z.boolean().optional().describe("True for write-in product"),
      productdescription: z.string().optional().describe("Write-in product name"),
      manualdiscountamount: z.number().optional().describe("Manual discount amount"),
      tax: z.number().optional().describe("Tax amount"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        quantity: params.quantity,
      };
      data["quoteid@odata.bind"] = `/quotes(${params.quoteid})`;
      if (params.productid) data["productid@odata.bind"] = `/products(${params.productid})`;
      if (params.uomid) data["uomid@odata.bind"] = `/uoms(${params.uomid})`;
      if (params.priceperunit !== undefined) data.priceperunit = params.priceperunit;
      if (params.description) data.description = params.description;
      if (params.isproductoverridden) data.isproductoverridden = params.isproductoverridden;
      if (params.productdescription) data.productdescription = params.productdescription;
      if (params.manualdiscountamount !== undefined) data.manualdiscountamount = params.manualdiscountamount;
      if (params.tax !== undefined) data.tax = params.tax;
      const result = await client.create("quotedetails", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "activate_quote",
    "Activate a draft quote in Dynamics 365 (set to Active status)",
    {
      id: z.string().describe("The quote GUID to activate"),
    },
    async (params) => {
      await client.update("quotes", params.id, {
        statecode: 1,
        statuscode: 2,
      });
      return { content: [{ type: "text", text: `Quote ${params.id} activated successfully.` }] };
    }
  );

  server.tool(
    "close_quote",
    "Close a quote as Won or Lost in Dynamics 365",
    {
      id: z.string().describe("The quote GUID to close"),
      status: z.enum(["won", "lost"]).describe("Close as 'won' or 'lost'"),
      description: z.string().optional().describe("Close description"),
    },
    async (params) => {
      const actionName = params.status === "won" ? "WinQuote" : "CloseQuote";
      const statusCode = params.status === "won" ? 4 : 5;
      const result = await client.executeAction(actionName, {
        QuoteClose: {
          quoteid: { "@odata.type": "Microsoft.Dynamics.CRM.quote", quoteid: params.id },
          description: params.description,
        },
        Status: statusCode,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
