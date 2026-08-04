import { afterEach, describe, expect, it, vi } from "vitest";

import { parseRetryAfterSeconds, verifyAccessKey } from "@/lib/access-gate/verify";

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

    await expect(verifyAccessKey("  gg-4821  ", "project-id")).resolves.toEqual({ status: "valid" });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://bwjxapgpjhlxpkvvysxf.supabase.co/functions/v1/verify-access-key");
    expect(url).not.toContain("GG-4821");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.headers).not.toHaveProperty("Authorization");
    expect(JSON.parse(options.body as string)).toEqual({ key: "GG-4821", project: "project-id" });
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
    await expect(verifyAccessKey("key", "project")).resolves.toEqual(expected);
  });

  it("fails closed for a malformed JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not json", { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
    await expect(verifyAccessKey("key", "project")).resolves.toEqual({ status: "unavailable" });
  });

  it("accepts a valid JSON body with a text/plain Content-Type", async () => {
    const fetchResponse = new Response(JSON.stringify({ valid: true }), {
      headers: { "Content-Type": "text/plain" },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fetchResponse));
    await expect(verifyAccessKey("key", "project")).resolves.toEqual({ status: "valid" });
  });

  it("accepts a valid JSON body without a Content-Type header", async () => {
    const fetchResponse = new Response(JSON.stringify({ valid: true }));
    fetchResponse.headers.delete("Content-Type");
    expect(fetchResponse.headers.has("Content-Type")).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fetchResponse));
    await expect(verifyAccessKey("key", "project")).resolves.toEqual({ status: "valid" });
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
    await expect(verifyAccessKey("key", "project")).resolves.toEqual(expected);
  });

  it("classifies rate limiting with its retry delay", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response(undefined, 429, { "Content-Type": "application/json", "Retry-After": "17" })),
    );
    await expect(verifyAccessKey("key", "project")).resolves.toEqual({
      status: "rate-limited",
      retryAfterSeconds: 17,
    });
  });

  it("classifies network failures as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network failure")));
    await expect(verifyAccessKey("key", "project")).resolves.toEqual({ status: "unavailable" });
  });

  it("uses a ten-second timeout and classifies an abort as unavailable", async () => {
    const abortedSignal = AbortSignal.abort();
    const timeoutMock = vi.spyOn(AbortSignal, "timeout").mockReturnValue(abortedSignal);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")));

    await expect(verifyAccessKey("key", "project")).resolves.toEqual({ status: "unavailable" });
    expect(timeoutMock).toHaveBeenCalledWith(10_000);
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







