import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerProductTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_products",
    "List products from Dynamics 365",
    {
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
    },
    async (params) => {
      const result = await client.list("products", {
        $filter: params.filter,
        $select: params.select || "name,productnumber,description,price,standardcost,currentcost,statecode,productstructure,quantitydecimal",
        $top: params.top || 50,
        $orderby: params.orderby,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_product",
    "Get a specific product by ID from Dynamics 365",
    {
      id: z.string().describe("The product GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("products", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_product",
    "Create a new product in Dynamics 365",
    {
      name: z.string().describe("Product name"),
      productnumber: z.string().describe("Product number/SKU"),
      description: z.string().optional().describe("Product description"),
      price: z.number().optional().describe("List price"),
      standardcost: z.number().optional().describe("Standard cost"),
      currentcost: z.number().optional().describe("Current cost"),
      quantitydecimal: z.number().optional().describe("Decimal places for quantity (0-5)"),
      defaultuomscheduleid: z.string().optional().describe("Default unit group ID (GUID)"),
      defaultuomid: z.string().optional().describe("Default unit ID (GUID)"),
      productstructure: z.number().optional().describe("Product structure (1=Product, 2=Product Family, 3=Bundle)"),
    },
    async (params) => {
      const data: Record<string, unknown> = { ...params };
      if (params.defaultuomscheduleid) {
        data["defaultuomscheduleid@odata.bind"] = `/uomschedules(${params.defaultuomscheduleid})`;
        delete data.defaultuomscheduleid;
      }
      if (params.defaultuomid) {
        data["defaultuomid@odata.bind"] = `/uoms(${params.defaultuomid})`;
        delete data.defaultuomid;
      }
      const result = await client.create("products", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_price_lists",
    "List price lists from Dynamics 365",
    {
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
    },
    async (params) => {
      const result = await client.list("pricelevels", {
        $filter: params.filter,
        $select: params.select || "name,description,begindate,enddate,statecode",
        $top: params.top || 50,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_price_list",
    "Create a new price list in Dynamics 365",
    {
      name: z.string().describe("Price list name"),
      description: z.string().optional().describe("Description"),
      begindate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      enddate: z.string().optional().describe("End date (YYYY-MM-DD)"),
      transactioncurrencyid: z.string().optional().describe("Currency ID (GUID)"),
    },
    async (params) => {
      const data: Record<string, unknown> = { ...params };
      if (params.transactioncurrencyid) {
        data["transactioncurrencyid@odata.bind"] = `/transactioncurrencies(${params.transactioncurrencyid})`;
        delete data.transactioncurrencyid;
      }
      const result = await client.create("pricelevels", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_price_list_item",
    "Add a product to a price list with pricing details",
    {
      pricelevelid: z.string().describe("Price list ID (GUID)"),
      productid: z.string().describe("Product ID (GUID)"),
      uomid: z.string().describe("Unit of measure ID (GUID)"),
      amount: z.number().describe("Price amount"),
      pricingmethodcode: z.number().optional().describe("Pricing method (1=Currency Amount, 2=Percent of List, etc.)"),
      quantitysellingcode: z.number().optional().describe("Quantity selling option (1=No Quantity, 2=Whole, 3=Fractional)"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        amount: params.amount,
        pricingmethodcode: params.pricingmethodcode ?? 1,
      };
      data["pricelevelid@odata.bind"] = `/pricelevels(${params.pricelevelid})`;
      data["productid@odata.bind"] = `/products(${params.productid})`;
      data["uomid@odata.bind"] = `/uoms(${params.uomid})`;
      if (params.quantitysellingcode) data.quantitysellingcode = params.quantitysellingcode;
      const result = await client.create("productpricelevels", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );
}
