import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DynamicsClient } from "../dynamics-client.js";

export function registerActivityTools(server: McpServer, client: DynamicsClient) {
  server.tool(
    "list_activities",
    "List activities (emails, tasks, appointments, phone calls) from Dynamics 365",
    {
      activityType: z.enum(["emails", "tasks", "appointments", "phonecalls"]).optional().describe("Activity type to filter (omit for all activity pointers)"),
      filter: z.string().optional().describe("OData $filter expression"),
      select: z.string().optional().describe("Comma-separated fields to return"),
      top: z.number().optional().describe("Max number of records (default 50)"),
      orderby: z.string().optional().describe("OData $orderby expression"),
      regarding: z.string().optional().describe("Filter by regarding object ID (GUID)"),
    },
    async (params) => {
      const entitySet = params.activityType || "activitypointers";
      let filter = params.filter || "";
      if (params.regarding) {
        const regardingFilter = `_regardingobjectid_value eq ${params.regarding}`;
        filter = filter ? `${filter} and ${regardingFilter}` : regardingFilter;
      }
      const result = await client.list(entitySet, {
        $filter: filter || undefined,
        $select: params.select || "subject,activitytypecode,scheduledstart,scheduledend,statecode,statuscode,description",
        $top: params.top || 50,
        $orderby: params.orderby || "scheduledstart desc",
      });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_email",
    "Create an email activity in Dynamics 365",
    {
      subject: z.string().describe("Email subject"),
      description: z.string().optional().describe("Email body"),
      regardingobjectid_account: z.string().optional().describe("Regarding account ID (GUID)"),
      regardingobjectid_contact: z.string().optional().describe("Regarding contact ID (GUID)"),
      regardingobjectid_opportunity: z.string().optional().describe("Regarding opportunity ID (GUID)"),
      to_contacts: z.array(z.string()).optional().describe("Array of contact GUIDs for To recipients"),
      from_systemuser: z.string().optional().describe("From system user ID (GUID)"),
      scheduledstart: z.string().optional().describe("Scheduled start date (ISO 8601)"),
      scheduledend: z.string().optional().describe("Scheduled end date (ISO 8601)"),
      directioncode: z.boolean().optional().describe("true = outgoing, false = incoming"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        subject: params.subject,
        description: params.description,
        directioncode: params.directioncode ?? true,
      };
      if (params.regardingobjectid_account) {
        data["regardingobjectid_account@odata.bind"] = `/accounts(${params.regardingobjectid_account})`;
      }
      if (params.regardingobjectid_contact) {
        data["regardingobjectid_contact@odata.bind"] = `/contacts(${params.regardingobjectid_contact})`;
      }
      if (params.regardingobjectid_opportunity) {
        data["regardingobjectid_opportunity@odata.bind"] = `/opportunities(${params.regardingobjectid_opportunity})`;
      }
      if (params.to_contacts?.length) {
        data.email_activity_parties = params.to_contacts.map((id) => ({
          "partyid_contact@odata.bind": `/contacts(${id})`,
          participationtypemask: 2, // To
        }));
      }
      if (params.from_systemuser) {
        const fromParty = {
          "partyid_systemuser@odata.bind": `/systemusers(${params.from_systemuser})`,
          participationtypemask: 1, // From
        };
        if (data.email_activity_parties) {
          (data.email_activity_parties as Array<unknown>).push(fromParty);
        } else {
          data.email_activity_parties = [fromParty];
        }
      }
      if (params.scheduledstart) data.scheduledstart = params.scheduledstart;
      if (params.scheduledend) data.scheduledend = params.scheduledend;
      const result = await client.create("emails", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_task",
    "Create a task activity in Dynamics 365",
    {
      subject: z.string().describe("Task subject"),
      description: z.string().optional().describe("Task description"),
      scheduledstart: z.string().optional().describe("Scheduled start date (ISO 8601)"),
      scheduledend: z.string().optional().describe("Due date (ISO 8601)"),
      prioritycode: z.number().optional().describe("Priority (0=Low, 1=Normal, 2=High)"),
      regardingobjectid_account: z.string().optional().describe("Regarding account ID (GUID)"),
      regardingobjectid_contact: z.string().optional().describe("Regarding contact ID (GUID)"),
      regardingobjectid_opportunity: z.string().optional().describe("Regarding opportunity ID (GUID)"),
      ownerid: z.string().optional().describe("Owner/assigned user ID (GUID)"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        subject: params.subject,
        description: params.description,
        prioritycode: params.prioritycode ?? 1,
      };
      if (params.scheduledstart) data.scheduledstart = params.scheduledstart;
      if (params.scheduledend) data.scheduledend = params.scheduledend;
      if (params.regardingobjectid_account) {
        data["regardingobjectid_account@odata.bind"] = `/accounts(${params.regardingobjectid_account})`;
      }
      if (params.regardingobjectid_contact) {
        data["regardingobjectid_contact@odata.bind"] = `/contacts(${params.regardingobjectid_contact})`;
      }
      if (params.regardingobjectid_opportunity) {
        data["regardingobjectid_opportunity@odata.bind"] = `/opportunities(${params.regardingobjectid_opportunity})`;
      }
      if (params.ownerid) {
        data["ownerid@odata.bind"] = `/systemusers(${params.ownerid})`;
      }
      const result = await client.create("tasks", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_appointment",
    "Create an appointment activity in Dynamics 365",
    {
      subject: z.string().describe("Appointment subject"),
      description: z.string().optional().describe("Appointment description"),
      scheduledstart: z.string().describe("Start date/time (ISO 8601)"),
      scheduledend: z.string().describe("End date/time (ISO 8601)"),
      location: z.string().optional().describe("Location"),
      regardingobjectid_account: z.string().optional().describe("Regarding account ID (GUID)"),
      regardingobjectid_contact: z.string().optional().describe("Regarding contact ID (GUID)"),
      regardingobjectid_opportunity: z.string().optional().describe("Regarding opportunity ID (GUID)"),
      requiredattendees: z.array(z.string()).optional().describe("Array of contact GUIDs for required attendees"),
      optionalattendees: z.array(z.string()).optional().describe("Array of contact GUIDs for optional attendees"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        subject: params.subject,
        description: params.description,
        scheduledstart: params.scheduledstart,
        scheduledend: params.scheduledend,
        location: params.location,
      };
      if (params.regardingobjectid_account) {
        data["regardingobjectid_account@odata.bind"] = `/accounts(${params.regardingobjectid_account})`;
      }
      if (params.regardingobjectid_contact) {
        data["regardingobjectid_contact@odata.bind"] = `/contacts(${params.regardingobjectid_contact})`;
      }
      if (params.regardingobjectid_opportunity) {
        data["regardingobjectid_opportunity@odata.bind"] = `/opportunities(${params.regardingobjectid_opportunity})`;
      }
      const parties: Array<Record<string, unknown>> = [];
      if (params.requiredattendees) {
        for (const id of params.requiredattendees) {
          parties.push({ "partyid_contact@odata.bind": `/contacts(${id})`, participationtypemask: 5 });
        }
      }
      if (params.optionalattendees) {
        for (const id of params.optionalattendees) {
          parties.push({ "partyid_contact@odata.bind": `/contacts(${id})`, participationtypemask: 6 });
        }
      }
      if (parties.length) data.appointment_activity_parties = parties;
      const result = await client.create("appointments", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_phone_call",
    "Create a phone call activity in Dynamics 365",
    {
      subject: z.string().describe("Phone call subject"),
      description: z.string().optional().describe("Description/notes"),
      phonenumber: z.string().optional().describe("Phone number called"),
      scheduledstart: z.string().optional().describe("Scheduled start (ISO 8601)"),
      scheduledend: z.string().optional().describe("Scheduled end (ISO 8601)"),
      directioncode: z.boolean().optional().describe("true = outgoing, false = incoming"),
      regardingobjectid_account: z.string().optional().describe("Regarding account ID (GUID)"),
      regardingobjectid_contact: z.string().optional().describe("Regarding contact ID (GUID)"),
      regardingobjectid_opportunity: z.string().optional().describe("Regarding opportunity ID (GUID)"),
    },
    async (params) => {
      const data: Record<string, unknown> = {
        subject: params.subject,
        description: params.description,
        phonenumber: params.phonenumber,
        directioncode: params.directioncode ?? true,
      };
      if (params.scheduledstart) data.scheduledstart = params.scheduledstart;
      if (params.scheduledend) data.scheduledend = params.scheduledend;
      if (params.regardingobjectid_account) {
        data["regardingobjectid_account@odata.bind"] = `/accounts(${params.regardingobjectid_account})`;
      }
      if (params.regardingobjectid_contact) {
        data["regardingobjectid_contact@odata.bind"] = `/contacts(${params.regardingobjectid_contact})`;
      }
      if (params.regardingobjectid_opportunity) {
        data["regardingobjectid_opportunity@odata.bind"] = `/opportunities(${params.regardingobjectid_opportunity})`;
      }
      const result = await client.create("phonecalls", data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_activity",
    "Update any activity (email, task, appointment, phone call) in Dynamics 365",
    {
      activityType: z.enum(["emails", "tasks", "appointments", "phonecalls"]).describe("The type of activity to update"),
      id: z.string().describe("The activity GUID to update"),
      subject: z.string().optional().describe("Updated subject"),
      description: z.string().optional().describe("Updated description"),
      scheduledstart: z.string().optional().describe("Updated scheduled start (ISO 8601)"),
      scheduledend: z.string().optional().describe("Updated scheduled end (ISO 8601)"),
      statecode: z.number().optional().describe("State code (0=Open, 1=Completed, 2=Canceled)"),
      statuscode: z.number().optional().describe("Status reason code"),
    },
    async (params) => {
      const { activityType, id, ...data } = params;
      await client.update(activityType, id, data);
      return { content: [{ type: "text", text: `Activity ${id} updated successfully.` }] };
    }
  );

  server.tool(
    "delete_activity",
    "Delete an activity from Dynamics 365",
    {
      activityType: z.enum(["emails", "tasks", "appointments", "phonecalls"]).describe("The type of activity to delete"),
      id: z.string().describe("The activity GUID to delete"),
    },
    async (params) => {
      await client.delete(params.activityType, params.id);
      return { content: [{ type: "text", text: `Activity ${params.id} deleted successfully.` }] };
    }
  );
}
