import { afterEach, describe, expect, it, vi } from "vitest";

import { parseRetryAfterSeconds, verifyAccessKey } from "@/lib/access-gate/verify";

const validKey = "ABCD-EFGH-JKLM-NPQ";
const endpoint = "https://verifier.example.com/functions/v1/verify-access-key";

function response(
  body: unknown,
  status = 200,
  headers: HeadersInit = { "Content-Type": "application/json" },
): Response {
  return new Response(body === undefined ? undefined : JSON.stringify(body), { status, headers });
}

describe("verifyAccessKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends only JSON content headers and the normalised contract body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ valid: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyAccessKey("  abcd-efgh-jklm-npq  ", "project-id", endpoint)).resolves.toEqual({ status: "valid" });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(endpoint);
    expect(url).not.toContain(validKey);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.headers).not.toHaveProperty("Authorization");
    expect(options.headers).not.toHaveProperty("apikey");
    const requestBody = JSON.parse(options.body as string) as Record<string, unknown>;
    expect(requestBody).toEqual({ key: validKey, project: "project-id" });
    expect(Object.keys(requestBody)).toHaveLength(2);
  });

  it.each([
    "ABC-EFGH-JKLM-NPQ",
    "ABCDE-EFGH-JKLM-NPQ",
    "ABCD-EFG-JKLM-NPQ",
    "ABCD-EFGH-JKLM-NP",
    "AICD-EFGH-JKLM-NPQ",
    "AOCD-EFGH-JKLM-NPQ",
    "A0CD-EFGH-JKLM-NPQ",
    "A1CD-EFGH-JKLM-NPQ",
    "",
  ])("rejects malformed key %j without fetching", async (key) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyAccessKey(key, "project", endpoint)).resolves.toEqual({ status: "malformed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalises a conforming lowercase key before validating and sending", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ valid: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyAccessKey("abcd-efgh-jklm-npq", "project", endpoint)).resolves.toEqual({ status: "valid" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ key: validKey, project: "project" });
  });

  it.each([
    [{ valid: true }, { status: "valid" }],
    [{ valid: false }, { status: "invalid" }],
    [{}, { status: "unavailable" }],
    [null, { status: "unavailable" }],
    [[], { status: "unavailable" }],
    [{ valid: "true" }, { status: "unavailable" }],
  ])("classifies a successful response with body %j", async (body, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(body)));
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual(expected);
  });

  it("fails closed for a malformed JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not json", { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual({ status: "unavailable" });
  });

  it("accepts a valid JSON body with a text/plain Content-Type", async () => {
    const fetchResponse = new Response(JSON.stringify({ valid: true }), {
      headers: { "Content-Type": "text/plain" },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fetchResponse));
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual({ status: "valid" });
  });

  it("accepts a valid JSON body without a Content-Type header", async () => {
    const fetchResponse = new Response(JSON.stringify({ valid: true }));
    fetchResponse.headers.delete("Content-Type");
    expect(fetchResponse.headers.has("Content-Type")).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fetchResponse));
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual({ status: "valid" });
  });

  it.each([
    [400, { status: "client-error" }],
    [405, { status: "client-error" }],
    [503, { status: "unavailable" }],
    [404, { status: "unavailable" }],
    [500, { status: "unavailable" }],
    [302, { status: "unavailable" }],
  ])("classifies status %i", async (status, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(undefined, status)));
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual(expected);
  });

  it("classifies rate limiting with its retry delay", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response(undefined, 429, { "Content-Type": "application/json", "Retry-After": "17" })),
    );
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual({
      status: "rate-limited",
      retryAfterSeconds: 17,
    });
  });

  it("classifies network failures as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network failure")));
    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual({ status: "unavailable" });
  });

  it("uses an eight-second timeout and classifies an abort as unavailable", async () => {
    const abortedSignal = AbortSignal.abort();
    const timeoutMock = vi.spyOn(AbortSignal, "timeout").mockReturnValue(abortedSignal);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")));

    await expect(verifyAccessKey(validKey, "project", endpoint)).resolves.toEqual({ status: "unavailable" });
    expect(timeoutMock).toHaveBeenCalledWith(8_000);
  });
});

describe("parseRetryAfterSeconds", () => {
  it.each([
    ["17", 0, 17],
    ["Wed, 21 Oct 2015 07:28:10 GMT", Date.parse("Wed, 21 Oct 2015 07:28:00 GMT"), 10],
    ["Wed, 21 Oct 2015 07:28:00 GMT", Date.parse("Wed, 21 Oct 2015 07:28:10 GMT"), 60],
    [null, 0, 60],
    ["later", 0, 60],
    ["-1", 0, 60],
    ["0", 0, 60],
    ["1.5", 0, 60],
  ])("parses %s as %i seconds", (header, now, expected) => {
    expect(parseRetryAfterSeconds(header, now)).toBe(expected);
  });
});







