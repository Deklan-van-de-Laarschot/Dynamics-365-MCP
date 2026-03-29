import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerInvoiceTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_invoices",
    "List invoices from Dynamics 365",
    {
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
    },
    async (params) => {
      const result = await client.list("invoices", {
        $filter: params.filter,
        $select: params.select || "name,invoicenumber,totalamount,statecode,statuscode,duedate,datedelivered,description",
        $top: params.top || 50,
        $orderby: params.orderby,
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_invoice",
    "Get a specific invoice by ID from Dynamics 365",
    {
      id: z.string().describe("The invoice GUID"),
      select: z.string().optional().describe("Comma-separated fields to return"),
    },
    async (params) => {
      const result = await client.get("invoices", params.id, params.select);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_invoice",
    "Create a new invoice in Dynamics 365",
    {
      name: z.string().describe("Invoice name/title"),
      customerid_account: z.string().optional().describe("Customer account ID (GUID)"),
      customerid_contact: z.string().optional().describe("Customer contact ID (GUID)"),
      pricelevelid: z.string().optional().describe("Price list ID (GUID)"),
      opportunityid: z.string().optional().describe("Opportunity ID (GUID)"),
      salesorderid: z.string().optional().describe("Sales order ID (GUID) this invoice is from"),
      description: z.string().optional().describe("Invoice description"),
      duedate: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      discountpercentage: z.number().optional().describe("Discount percentage"),
      discountamount: z.number().optional().describe("Discount amount"),
      freightamount: z.number().optional().describe("Freight/shipping amount"),
      paymenttermscode: z.number().optional().describe("Payment terms code"),
      shippingmethodcode: z.number().optional().describe("Shipping method code"),
      billto_name: z.string().optional().describe("Bill to name"),
      billto_line1: z.string().optional().describe("Bill to address"),
      billto_city: z.string().optional().describe("Bill to city"),
      billto_stateorprovince: z.string().optional().describe("Bill to state/province"),
      billto_postalcode: z.string().optional().describe("Bill to postal code"),
      billto_country: z.string().optional().describe("Bill to country"),
      shipto_name: z.string().optional().describe("Ship to name"),
      shipto_line1: z.string().optional().describe("Ship to address"),
      shipto_city: z.string().optional().describe("Ship to city"),
      shipto_stateorprovince: z.string().optional().describe("Ship to state/province"),
      shipto_postalcode: z.string().optional().describe("Ship to postal code"),
      shipto_country: z.string().optional().describe("Ship to country"),
      transactioncurrencyid: z.string().optional().describe("Currency ID (GUID)"),
    },
    async (params) => {
      const data: Record<string, unknown> = {};
      const lookups: Record<string, string> = {
        customerid_account: "accounts",
        customerid_contact: "contacts",
        pricelevelid: "pricelevels",
        opportunityid: "opportunities",
        salesorderid: "salesorders",
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
      const result = await client.create("invoices", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "add_invoice_detail",
    "Add a product line item to an invoice",
    {
      invoiceid: z.string().describe("Invoice ID (GUID)"),
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
      data["invoiceid@odata.bind"] = `/invoices(${params.invoiceid})`;
      if (params.productid) data["productid@odata.bind"] = `/products(${params.productid})`;
      if (params.uomid) data["uomid@odata.bind"] = `/uoms(${params.uomid})`;
      if (params.priceperunit !== undefined) data.priceperunit = params.priceperunit;
      if (params.description) data.description = params.description;
      if (params.isproductoverridden) data.isproductoverridden = params.isproductoverridden;
      if (params.productdescription) data.productdescription = params.productdescription;
      if (params.manualdiscountamount !== undefined) data.manualdiscountamount = params.manualdiscountamount;
      if (params.tax !== undefined) data.tax = params.tax;
      const result = await client.create("invoicedetails", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "pay_invoice",
    "Mark an invoice as Paid in Dynamics 365",
    {
      id: z.string().describe("The invoice GUID to mark as paid"),
      closedatetime: z.string().optional().describe("Payment date (ISO 8601)"),
      description: z.string().optional().describe("Payment description"),
    },
    async (params) => {
      await client.update("invoices", params.id, {
        statecode: 2,
        statuscode: 100001,
      });
      return { content: [{ type: "text", text: `Invoice ${params.id} marked as paid.` }] };
    }
  );

  server.tool(
    "cancel_invoice",
    "Cancel an invoice in Dynamics 365",
    {
      id: z.string().describe("The invoice GUID to cancel"),
      description: z.string().optional().describe("Cancellation reason"),
    },
    async (params) => {
      await client.update("invoices", params.id, {
        statecode: 3,
        statuscode: 100003,
      });
      return { content: [{ type: "text", text: `Invoice ${params.id} cancelled.` }] };
    }
  );
}
