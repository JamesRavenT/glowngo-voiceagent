import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { services, stylists } from "@/content";

type TableValue = number | string[];
type ParsedTable = Record<string, TableValue>;

interface WorkflowTable<T extends ParsedTable> {
  nodeName: string;
  values: T;
}

const workflow = JSON.parse(
  readFileSync(resolve(process.cwd(), "integrations/n8n/booking.workflow.json"), "utf8"),
) as {
  nodes: Array<{
    name: string;
    type: string;
    parameters?: { jsCode?: string };
  }>;
};

const skipWhitespace = (source: string, start: number) => {
  let position = start;
  while (/\s/.test(source[position] ?? "")) position += 1;
  return position;
};

const parseQuotedString = (source: string, start: number) => {
  const quote = source[start];
  if (quote !== '"' && quote !== "'") return undefined;

  let value = "";
  for (let position = start + 1; position < source.length; position += 1) {
    const character = source[position];
    if (character === quote) return { value, end: position + 1 };
    if (character === "\\") {
      position += 1;
      if (position >= source.length) return undefined;
      value += source[position];
    } else {
      value += character;
    }
  }

  return undefined;
};

const parseStringArray = (source: string, start: number) => {
  if (source[start] !== "[") return undefined;

  const values: string[] = [];
  let position = skipWhitespace(source, start + 1);
  while (source[position] !== "]") {
    const parsedString = parseQuotedString(source, position);
    if (!parsedString) return undefined;
    values.push(parsedString.value);
    position = skipWhitespace(source, parsedString.end);

    if (source[position] === ",") {
      position = skipWhitespace(source, position + 1);
    } else if (source[position] !== "]") {
      return undefined;
    }
  }

  return { value: values, end: position + 1 };
};

const parseObjectLiteral = (source: string, start: number) => {
  if (source[start] !== "{") return undefined;

  const values: ParsedTable = {};
  let position = skipWhitespace(source, start + 1);
  while (source[position] !== "}") {
    const quotedKey = parseQuotedString(source, position);
    const unquotedKey = /^[A-Za-z_$][\w$]*/.exec(source.slice(position));
    const key = quotedKey?.value ?? unquotedKey?.[0];
    if (!key) return undefined;

    position = skipWhitespace(
      source,
      quotedKey?.end ?? position + (unquotedKey?.[0].length ?? 0),
    );
    if (source[position] !== ":") return undefined;
    position = skipWhitespace(source, position + 1);

    const stringArray = parseStringArray(source, position);
    const number = /^-?\d+(?:\.\d+)?/.exec(source.slice(position));
    if (stringArray) {
      values[key] = stringArray.value;
      position = stringArray.end;
    } else if (number) {
      values[key] = Number(number[0]);
      position += number[0].length;
    } else {
      return undefined;
    }

    position = skipWhitespace(source, position);
    if (source[position] === ",") {
      position = skipWhitespace(source, position + 1);
    } else if (source[position] !== "}") {
      return undefined;
    }
  }

  return Object.keys(values).length > 0 ? values : undefined;
};

const durationTables: Array<WorkflowTable<Record<string, number>>> = [];
const teamTables: Array<WorkflowTable<Record<string, string[]>>> = [];

for (const node of workflow.nodes.filter(({ type }) => type === "n8n-nodes-base.code")) {
  const jsCode = node.parameters?.jsCode;
  if (!jsCode) continue;

  for (const assignment of jsCode.matchAll(
    /\b(?:const\s+)?[A-Za-z_$][\w$]*\s*=\s*(?=\{)/g,
  )) {
    const table = parseObjectLiteral(jsCode, (assignment.index ?? 0) + assignment[0].length);
    if (!table) continue;

    const values = Object.values(table);
    if (values.every((value) => typeof value === "number")) {
      durationTables.push({
        nodeName: node.name,
        values: table as Record<string, number>,
      });
    } else if (
      values.every(
        (value) => Array.isArray(value) && value.every((item) => typeof item === "string"),
      )
    ) {
      teamTables.push({
        nodeName: node.name,
        values: table as Record<string, string[]>,
      });
    }
  }
}

const contentDurations = Object.fromEntries(
  services.map(({ id, durationMinutes }) => [id, durationMinutes]),
);
const contentTeams = stylists.reduce<Record<string, string[]>>((teams, stylist) => {
  (teams[stylist.branchId] ??= []).push(stylist.id);
  return teams;
}, {});

const displayValue = (value: number | string[] | undefined) =>
  value === undefined
    ? "<missing>"
    : Array.isArray(value)
      ? JSON.stringify([...new Set(value)].sort())
      : String(value);

const expectDurationsToMatch = (
  table: WorkflowTable<Record<string, number>>,
  expected: Record<string, number>,
  expectedSource: string,
) => {
  for (const key of new Set([...Object.keys(table.values), ...Object.keys(expected)])) {
    expect(
      table.values[key],
      `${table.nodeName}: duration for "${key}" is ${displayValue(table.values[key])} in workflow but ${displayValue(expected[key])} in ${expectedSource}`,
    ).toBe(expected[key]);
  }
};

const expectTeamsToMatch = (
  table: WorkflowTable<Record<string, string[]>>,
  expected: Record<string, string[]>,
  expectedSource: string,
) => {
  for (const key of new Set([...Object.keys(table.values), ...Object.keys(expected)])) {
    const workflowTeam = table.values[key];
    const expectedTeam = expected[key];
    expect(
      workflowTeam && [...new Set(workflowTeam)].sort(),
      `${table.nodeName}: team for "${key}" is ${displayValue(workflowTeam)} in workflow but ${displayValue(expectedTeam)} in ${expectedSource}`,
    ).toEqual(expectedTeam && [...new Set(expectedTeam)].sort());
  }
};

describe("n8n workflow content drift", () => {
  it("finds hardcoded duration and team tables", () => {
    expect(
      durationTables.length,
      "No duration table was found in any n8n Code node; check the workflow and parser",
    ).toBeGreaterThan(0);
    expect(
      teamTables.length,
      "No team table was found in any n8n Code node; check the workflow and parser",
    ).toBeGreaterThan(0);
  });

  it("keeps every workflow duration table aligned with content/services.ts", () => {
    for (const table of durationTables) {
      expectDurationsToMatch(table, contentDurations, "content/services.ts");
    }
  });

  it("keeps every workflow team table aligned with content/stylists.ts", () => {
    for (const table of teamTables) {
      expectTeamsToMatch(table, contentTeams, "content/stylists.ts");
    }
  });

  it("keeps duplicate workflow tables aligned with each other", () => {
    const [firstDuration, ...otherDurations] = durationTables;
    for (const table of otherDurations) {
      expectDurationsToMatch(table, firstDuration.values, `${firstDuration.nodeName} workflow node`);
    }

    const [firstTeam, ...otherTeams] = teamTables;
    for (const table of otherTeams) {
      expectTeamsToMatch(table, firstTeam.values, `${firstTeam.nodeName} workflow node`);
    }
  });
});
