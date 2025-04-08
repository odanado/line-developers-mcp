import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReadDocumentation } from "./read-documentation.ts";
import { chromium } from "playwright";

const browser = await chromium.launch();

const MOCK_HTML = `
<html>
  <head></head>
  <body>
    Outer text
    <div class="content__default">
      <h1>Test Documentation</h1>
    </div>
    Outer text
  </body>
</html>
`;

const MOCK_URL = "https://example.com/readDocumentation";

describe("readDocumentation", () => {
  it("should fetch and parse documentation content properly", async () => {
    const client = new Client({
      name: "test client",
      version: "0.1.0",
    });
    const server = new McpServer({
      name: "test server",
      version: "0.1.0",
    });

    const page = await browser.newPage();
    await page.route(MOCK_URL, async (route) => {
      await route.fulfill({
        contentType: "text/html",
        body: MOCK_HTML,
      });
    });

    registerReadDocumentation({
      server,
      page,
    });

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const result = await client.callTool({
      name: "readDocumentation",
      arguments: {
        url: MOCK_URL,
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "# Test Documentation",
        },
      ],
    });
  });
});
