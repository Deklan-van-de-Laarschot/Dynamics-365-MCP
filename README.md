# Dynamics 365 Sales MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that gives Claude full control over your Dynamics 365 Sales environment. Manage the entire sales pipeline — from leads and opportunities through to quotes, orders, and invoices — directly through natural language.

## Features

- **Accounts & Contacts** — full CRUD for customers and contacts
- **Leads** — create, qualify, and convert leads
- **Opportunities** — manage pipeline, win/lose deals, add products
- **Activities** — emails, tasks, appointments, phone calls
- **Products & Price Lists** — catalogue and pricing management
- **Quotes** — create, activate, and close quotes
- **Orders** — create and fulfil sales orders
- **Invoices** — create, pay, and cancel invoices
- **Search** — OData and FetchXML queries across any entity

50+ tools in total, covering the complete Dynamics 365 Sales lifecycle.

## Prerequisites

- Node.js 18 or later
- A Dynamics 365 Sales environment
- An Azure AD app registration (see [Setup](#setup))

## Setup

### 1. Clone & install

```bash
git clone https://github.com/your-username/dynamics365-sales-mcp.git
cd dynamics365-sales-mcp
npm install
npm run build
```

### 2. Create an Azure AD app registration

You need an app registration in Azure AD with client credentials to authenticate against the Dynamics 365 Web API.

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Give it a name (e.g. `Dynamics365 MCP`) and click **Register**
3. Note the **Application (client) ID** and **Directory (tenant) ID**
4. Go to **Certificates & secrets** → **New client secret** — note the secret value
5. Go to **API permissions** → **Add a permission** → **Dynamics CRM** → **Delegated** → `user_impersonation` → **Grant admin consent**

### 3. Create an Application User in Dynamics 365

1. In Dynamics 365, go to **Settings** → **Security** → **Users**
2. Switch the view to **Application Users** → **New**
3. Set **User type** to `Application User`
4. Enter the **Application ID** from your Azure AD app registration
5. Assign an appropriate **Security Role** (e.g. `Salesperson` or `System Administrator`)

### 4. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

```env
# Your Dynamics 365 instance URL
DYNAMICS_URL=https://yourorg.crm.dynamics.com

# Azure AD app registration
TENANT_ID=your-tenant-id
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
```

> **Tip:** Your `DYNAMICS_URL` is the base URL of your Dynamics 365 environment — no trailing slash.

### 5. Add to Claude Desktop

Open Claude Desktop and go to **Settings** → **Developer** → **Edit Config** to open the config file, or edit it directly:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following:

```json
{
  "mcpServers": {
    "dynamics365-sales": {
      "command": "node",
      "args": ["/absolute/path/to/dynamics365-sales-mcp/dist/index.js"],
      "env": {
        "DYNAMICS_URL": "https://yourorg.crm.dynamics.com",
        "TENANT_ID": "your-tenant-id",
        "CLIENT_ID": "your-client-id",
        "CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

**Restart Claude Desktop** after saving. You should see a hammer icon in the chat input bar indicating MCP tools are available. Click it to confirm the Dynamics 365 tools are listed.

> **macOS path example:**
> ```json
> "args": ["/Users/yourname/Development/dynamics365-sales-mcp/dist/index.js"]
> ```
>
> **Windows path example:**
> ```json
> "args": ["C:\\Users\\yourname\\Development\\dynamics365-sales-mcp\\dist\\index.js"]
> ```

### 6. Add to Claude Code

Add the following to your Claude Code MCP configuration. The config file is at:
- **macOS/Linux:** `~/.claude/settings.json`
- **Windows:** `%APPDATA%\Claude\settings.json`

```json
{
  "mcpServers": {
    "dynamics365-sales": {
      "command": "node",
      "args": ["/absolute/path/to/dynamics365-sales-mcp/dist/index.js"],
      "env": {
        "DYNAMICS_URL": "https://yourorg.crm.dynamics.com",
        "TENANT_ID": "your-tenant-id",
        "CLIENT_ID": "your-client-id",
        "CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

Restart Claude Code after saving. You should see the Dynamics 365 tools available in your session.

## Available Tools

### Accounts
| Tool | Description |
|------|-------------|
| `list_accounts` | List accounts with filtering, sorting, and field selection |
| `get_account` | Retrieve a single account by ID |
| `create_account` | Create a new account |
| `update_account` | Update an existing account |
| `delete_account` | Delete an account |

### Contacts
| Tool | Description |
|------|-------------|
| `list_contacts` | List contacts with filtering and sorting |
| `get_contact` | Retrieve a single contact by ID |
| `create_contact` | Create a new contact |
| `update_contact` | Update an existing contact |
| `delete_contact` | Delete a contact |

### Leads
| Tool | Description |
|------|-------------|
| `list_leads` | List leads with filtering and sorting |
| `get_lead` | Retrieve a single lead by ID |
| `create_lead` | Create a new lead |
| `update_lead` | Update an existing lead |
| `delete_lead` | Delete a lead |
| `qualify_lead` | Qualify a lead — converts to account, contact, and/or opportunity |

### Opportunities
| Tool | Description |
|------|-------------|
| `list_opportunities` | List opportunities with filtering and sorting |
| `get_opportunity` | Retrieve a single opportunity by ID |
| `create_opportunity` | Create a new opportunity |
| `update_opportunity` | Update an existing opportunity |
| `delete_opportunity` | Delete an opportunity |
| `win_opportunity` | Close an opportunity as Won |
| `lose_opportunity` | Close an opportunity as Lost |
| `list_opportunity_products` | List products on an opportunity |
| `add_opportunity_product` | Add a product line item to an opportunity |

### Activities
| Tool | Description |
|------|-------------|
| `list_activities` | List activities (all types or filtered by type) |
| `create_email` | Create an email activity |
| `create_task` | Create a task |
| `create_appointment` | Create an appointment |
| `create_phone_call` | Create a phone call activity |
| `update_activity` | Update any activity |
| `delete_activity` | Delete an activity |

### Products & Price Lists
| Tool | Description |
|------|-------------|
| `list_products` | List products with filtering |
| `get_product` | Retrieve a single product by ID |
| `create_product` | Create a new product |
| `list_price_lists` | List price lists |
| `create_price_list` | Create a new price list |
| `add_price_list_item` | Add a product to a price list with pricing |

### Quotes
| Tool | Description |
|------|-------------|
| `list_quotes` | List quotes with filtering and sorting |
| `get_quote` | Retrieve a single quote by ID |
| `create_quote` | Create a new quote |
| `add_quote_detail` | Add a product line item to a quote |
| `activate_quote` | Activate a draft quote |
| `close_quote` | Close a quote as Won or Lost |

### Orders
| Tool | Description |
|------|-------------|
| `list_orders` | List sales orders with filtering and sorting |
| `get_order` | Retrieve a single order by ID |
| `create_order` | Create a new sales order |
| `add_order_detail` | Add a product line item to an order |
| `fulfill_order` | Mark an order as fulfilled |
| `cancel_order` | Cancel a sales order |

### Invoices
| Tool | Description |
|------|-------------|
| `list_invoices` | List invoices with filtering and sorting |
| `get_invoice` | Retrieve a single invoice by ID |
| `create_invoice` | Create a new invoice |
| `add_invoice_detail` | Add a product line item to an invoice |
| `pay_invoice` | Mark an invoice as paid |
| `cancel_invoice` | Cancel an invoice |

### Search & Query
| Tool | Description |
|------|-------------|
| `search_records` | OData query against any Dynamics 365 entity |
| `execute_fetchxml` | Run a FetchXML query for complex joins and aggregations |
| `get_next_page` | Retrieve the next page using an `@odata.nextLink` URL |

## Example Prompts

Once configured, you can use natural language with Claude:

```
Show me all open opportunities over £50,000 closing this quarter.

Create a new lead for Jane Smith at Contoso Ltd — email jane@contoso.com, phone 01234 567890.

Qualify the lead for Jane Smith and create an opportunity worth £25,000.

Add our Enterprise Software product to the Contoso opportunity at £10,000.

Create a quote for the Contoso opportunity and activate it.

Convert the Contoso quote into a sales order.

Create an invoice for the Contoso order and mark it as paid.

Log a phone call with Jane Smith regarding the renewal discussion.

Find all accounts in the United Kingdom with more than 100 employees.
```

## Architecture

```
src/
├── index.ts              # MCP server entry point & tool registration
├── auth.ts               # OAuth2 client credentials token management
├── dynamics-client.ts    # HTTP client for the Dynamics 365 Web API
├── types.ts              # Shared TypeScript types
└── tools/
    ├── accounts.ts       # Account tools
    ├── contacts.ts       # Contact tools
    ├── leads.ts          # Lead tools
    ├── opportunities.ts  # Opportunity tools
    ├── activities.ts     # Activity tools
    ├── products.ts       # Product & price list tools
    ├── quotes.ts         # Quote tools
    ├── orders.ts         # Order tools
    ├── invoices.ts       # Invoice tools
    └── search.ts         # Search & FetchXML tools
```

The server authenticates using OAuth2 client credentials and communicates with Dynamics 365 via the [Web API (OData v9.2)](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview). Tokens are cached in memory and refreshed automatically before expiry.

## OData Filtering

Most list tools accept an OData `$filter` parameter. Some useful examples:

```
# Open opportunities
statecode eq 0

# Opportunities closing this month
statecode eq 0 and estimatedclosedate le 2024-01-31T00:00:00Z

# Accounts in a specific country
address1_country eq 'United Kingdom'

# High-value leads
estimatedvalue gt 50000

# Contacts at a specific company
_parentcustomerid_value eq <account-guid>
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## Troubleshooting

**Authentication errors** — verify your `TENANT_ID`, `CLIENT_ID`, and `CLIENT_SECRET` are correct and that admin consent has been granted for the Dynamics CRM API permission.

**403 Forbidden** — the Application User in Dynamics 365 may not have the correct security role. Ensure it has at least `Salesperson` access to the entities you're querying.

**404 Not Found** — check that your `DYNAMICS_URL` points to the correct environment and doesn't have a trailing slash.

**Entity or field not found** — field names and entity set names are case-sensitive in the OData API. Refer to the [Dynamics 365 entity reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/) for the correct names.

## License

MIT
