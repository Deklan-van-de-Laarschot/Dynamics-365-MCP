#!/usr/bin/env node
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DynamicsAuth } from "./auth.js";
import { DynamicsClient } from "./dynamics-client.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerLeadTools } from "./tools/leads.js";
import { registerOpportunityTools } from "./tools/opportunities.js";
import { registerActivityTools } from "./tools/activities.js";
import { registerProductTools } from "./tools/products.js";
import { registerQuoteTools } from "./tools/quotes.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerInvoiceTools } from "./tools/invoices.js";
import { registerSearchTools } from "./tools/search.js";

const dynamicsUrl = process.env.DYNAMICS_URL;
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

if (!dynamicsUrl || !tenantId || !clientId || !clientSecret) {
  console.error(
    "Missing required environment variables: DYNAMICS_URL, TENANT_ID, CLIENT_ID, CLIENT_SECRET"
  );
  process.exit(1);
}

const auth = new DynamicsAuth({ tenantId, clientId, clientSecret, dynamicsUrl });
const client = new DynamicsClient(auth, dynamicsUrl);

const server = new McpServer({
  name: "dynamics365-sales",
  version: "1.0.0",
});

// Register all tool groups
registerAccountTools(server, client);
registerContactTools(server, client);
registerLeadTools(server, client);
registerOpportunityTools(server, client);
registerActivityTools(server, client);
registerProductTools(server, client);
registerQuoteTools(server, client);
registerOrderTools(server, client);
registerInvoiceTools(server, client);
registerSearchTools(server, client);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Dynamics 365 Sales MCP server running on stdio");
