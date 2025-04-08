import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { server } from "./server.ts";

describe("MCP Server", () => {
  it("should register all required tools", async () => {
    const client = new Client({
      name: "test client",
      version: "0.1.0",
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const response = await client.listTools();

    expect(response.tools.length).toBe(2);

    const toolNames = response.tools.map((tool) => tool.name);

    expect(toolNames).toContain("readDocumentation");
    expect(toolNames).toContain("searchDocumentation");
  });
});
