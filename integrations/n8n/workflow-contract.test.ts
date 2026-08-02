import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { POST as cancel } from "@/app/api/mock/cancel-booking/route";
import { POST as check } from "@/app/api/mock/check-availability/route";
import { POST as create } from "@/app/api/mock/create-booking/route";
import { POST as reschedule } from "@/app/api/mock/reschedule-booking/route";
import { resetBookingStore } from "@/lib/booking/store";
import type { Booking } from "@/lib/booking/types";

type JsonObject = Record<string, unknown>;
type WorkflowNode = {
  name: string;
  type: string;
  typeVersion: number;
  alwaysOutputData?: boolean;
  parameters: JsonObject & { jsCode?: string };
};
type Connection = { node: string; type: string; index: number };
type Workflow = {
  nodes: WorkflowNode[];
  connections: Record<string, { main: Connection[][] }>;
};

const workflowPath = resolve(process.cwd(), "integrations/n8n/booking.workflow.json");
const workflow = JSON.parse(readFileSync(workflowPath, "utf8")) as Workflow;
const nodes = new Map(workflow.nodes.map((node) => [node.name, node]));
const responseType = "n8n-nodes-base.respondToWebhook";
const request = (path: string, body: unknown) => new Request(`http://localhost${path}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const createBody = { branchId: "silver-lake", serviceId: "precision-cut", stylistId: "dmitri", date: "2026-07-16", time: "09:00", customerName: "Test Person", customerPhone: "555-0199" };
const booking: Booking & { row_number: number } = { ...createBody, reference: "GG-1000", row_number: 2 };

const outgoing = (name: string, output = 0) => workflow.connections[name]?.main[output] ?? [];
const reachable = (start: string): Set<string> => {
  const visited = new Set<string>();
  const pending = [start];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const output of workflow.connections[current]?.main ?? []) {
      for (const connection of output) pending.push(connection.node);
    }
  }
  return visited;
};

const executeCodeNode = (nodeName: string, body: JsonObject, rows: object[] = []) => {
  const code = nodes.get(nodeName)?.parameters.jsCode;
  expect(code, `${nodeName} must contain jsCode`).toBeTypeOf("string");
  const getNode = () => ({ first: () => ({ json: { body } }) });
  const input = { all: () => rows.map((json) => ({ json })) };
  return Function("$", "$input", code!)(getNode, input) as Array<{ json: JsonObject }>;
};

const mockResult = async (handler: (request: Request) => Promise<Response>, path: string, body: JsonObject) => {
  const response = await handler(request(path, body));
  return { statusCode: response.status, body: await response.json() };
};

describe("n8n workflow response contract", () => {
  it("uses explicit response nodes on every webhook path", () => {
    const webhooks = workflow.nodes.filter(({ type }) => type === "n8n-nodes-base.webhook");
    const responses = workflow.nodes.filter(({ type }) => type === responseType);
    expect(webhooks).toHaveLength(4);
    expect(responses).toHaveLength(4);
    for (const webhook of webhooks) {
      expect(webhook.parameters.responseMode).toBe("responseNode");
      const pathNodes = reachable(webhook.name);
      const terminals = [...pathNodes].filter((name) => !workflow.connections[name]?.main?.flat().length);
      expect(terminals).not.toHaveLength(0);
      expect(terminals.every((name) => nodes.get(name)?.type === responseType)).toBe(true);
    }
    for (const response of responses) {
      expect(response.typeVersion).toBe(1.5);
    }
  });

  it("routes mutation errors around Sheets and successes through Sheets before responding", () => {
    const paths = [
      ["Validate and Build Booking", "Append Booking", "Respond to Create Booking"],
      ["Validate Reschedule", "Update Booking", "Respond to Reschedule Booking"],
      ["Validate Cancellation", "Delete Booking", "Respond to Cancel Booking"],
    ] as const;

    for (const [validator, mutation, response] of paths) {
      const branch = outgoing(validator)[0]?.node;
      const branchNode = nodes.get(branch);
      expect(branchNode?.type).toBe("n8n-nodes-base.if");
      const condition = (branchNode?.parameters.conditions as { conditions: Array<{ leftValue: string; operator: { operation: string } }> }).conditions[0];
      expect(condition.leftValue).toBe("={{ $json.statusCode }}");
      expect(condition.operator.operation).toBe("exists");
      expect(outgoing(branch, 0).map(({ node }) => node)).toEqual([response]);
      expect(outgoing(branch, 1).map(({ node }) => node)).toEqual([mutation]);
      expect(reachable(response)).not.toContain(mutation);
      expect(outgoing(mutation).map(({ node }) => node)).toEqual([response]);
    }
  });

  it("preserves required Google Sheets node settings", () => {
    for (const name of ["Read Bookings for Availability", "Read Bookings for Create", "Read Bookings for Reschedule", "Read Bookings for Cancel"]) {
      expect(nodes.get(name)?.alwaysOutputData).toBe(true);
    }
    expect((nodes.get("Append Booking")?.parameters.columns as JsonObject).mappingMode).toBe("autoMapInputData");
    expect((nodes.get("Update Booking")?.parameters.columns as JsonObject).matchingColumns).toEqual(["reference"]);
    expect(nodes.get("Delete Booking")?.parameters.startIndex).toBe("={{ $json.row_number }}");
  });

  it("responds with 201 for create success and 200 for the other successes", () => {
    expect(nodes.get("Respond to Create Booking")?.parameters.options).toEqual({ responseCode: "={{ $json.statusCode ?? 201 }}" });
    expect(nodes.get("Respond to Availability")?.parameters.options).toEqual({ responseCode: "={{ $json.statusCode }}" });
    expect(nodes.get("Respond to Reschedule Booking")?.parameters.options).toEqual({ responseCode: "={{ $json.statusCode ?? 200 }}" });
    expect(nodes.get("Respond to Cancel Booking")?.parameters.options).toEqual({ responseCode: "={{ $json.statusCode ?? 200 }}" });
  });
});

describe("n8n Code nodes match mock-route errors", () => {
  beforeEach(() => resetBookingStore([]));

  it.each([
    ["Compute Availability", check, "/check", { serviceId: "precision-cut", date: "2026-07-16" }, []],
    ["Compute Availability", check, "/check", { branchId: "unknown", serviceId: "precision-cut", date: "2026-07-16" }, []],
    ["Compute Availability", check, "/check", { branchId: "silver-lake", serviceId: "unknown", date: "2026-07-16" }, []],
    ["Compute Availability", check, "/check", { branchId: "silver-lake", serviceId: "precision-cut", date: "2026-99-99" }, []],
    ["Validate and Build Booking", create, "/create", { ...createBody, customerName: undefined }, []],
    ["Validate and Build Booking", create, "/create", { ...createBody, branchId: "unknown" }, []],
    ["Validate and Build Booking", create, "/create", { ...createBody, serviceId: "unknown" }, []],
    ["Validate and Build Booking", create, "/create", { ...createBody, date: "2026-07-13" }, []],
    ["Validate Reschedule", reschedule, "/reschedule", { reference: "bad", date: "2026-07-16", time: "10:00" }, []],
    ["Validate Reschedule", reschedule, "/reschedule", { reference: "GG-9999", date: "2026-07-16", time: "10:00" }, []],
    ["Validate Cancellation", cancel, "/cancel", {}, []],
    ["Validate Cancellation", cancel, "/cancel", { reference: "bad" }, []],
    ["Validate Cancellation", cancel, "/cancel", { reference: "GG-9999" }, []],
  ] as const)("%s mirrors its mock route", async (nodeName, handler, path, body, rows) => {
    const expected = await mockResult(handler, path, body);
    expect(executeCodeNode(nodeName, body, [...rows])[0]?.json).toEqual(expected);
  });

  it("matches the unavailable-slot contract for create and reschedule", async () => {
    resetBookingStore([booking]);
    expect(executeCodeNode("Validate and Build Booking", createBody, [booking])[0]?.json).toEqual(await mockResult(create, "/create", createBody));
    const missingDate = { reference: booking.reference };
    expect(executeCodeNode("Validate Reschedule", missingDate, [booking])[0]?.json).toEqual(await mockResult(reschedule, "/reschedule", missingDate));
    const invalidDate = { reference: booking.reference, date: "2026-99-99", time: "09:00" };
    expect(executeCodeNode("Validate Reschedule", invalidDate, [booking])[0]?.json).toEqual(await mockResult(reschedule, "/reschedule", invalidDate));
    const rescheduleBody = { reference: booking.reference, date: "2026-07-13", time: "09:00" };
    expect(executeCodeNode("Validate Reschedule", rescheduleBody, [booking])[0]?.json).toEqual(await mockResult(reschedule, "/reschedule", rescheduleBody));
  });
});

describe("ElevenLabs webhook tool error passthrough", () => {
  const toolNames = ["check_availability", "create_booking", "reschedule_booking", "cancel_booking"];

  it.each(toolNames)("enables passthrough for %s", (toolName) => {
    const tool = JSON.parse(readFileSync(resolve(process.cwd(), `integrations/elevenlabs/${toolName}.json`), "utf8")) as JsonObject;
    expect(tool.tool_error_handling_mode).toBe("passthrough");
  });

  it("preserves availability error bodies through the response filter", () => {
    const tool = JSON.parse(readFileSync(resolve(process.cwd(), "integrations/elevenlabs/check_availability.json"), "utf8")) as { api_schema: { response_filter: { filters: string[] } } };
    expect(tool.api_schema.response_filter.filters).toContain("error");
  });
});
