import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchDocumentation } from "./search-documentation.ts";
import { chromium } from "playwright";

const browser = await chromium.launch();

const MOCK_HTML = `
<html>
  <head></head>
  <body>
    <div class="search-result">
      <div>Documentation</div>
      <div class="result-title">Testing Documentation</div>
      <div class="result-url">/en/docs/test</div>
      <div class="result-body">This is a test documentation</div>
    </div>
    <div class="search-result">
      <div>FAQ</div>
      <div class="result-title">FAQ Question</div>
      <div class="result-url">/en/faq/test</div>
      <div class="result-body">This is a FAQ entry</div>
    </div>
  </body>
</html>
`;

const MOCK_URL = "https://developers.line.biz/en/search";
const MOCK_SEARCH_PHRASE = "test";

describe("searchDocumentation", () => {
  it("should extract documentation and FAQ results from search response", async () => {
    const client = new Client({
      name: "test client",
      version: "0.1.0",
    });
    const server = new McpServer({
      name: "test server",
      version: "0.1.0",
    });

    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      console.log("route", route.request().url());
      if (route.request().url().startsWith(MOCK_URL)) {
        await route.fulfill({
          contentType: "text/html",
          body: MOCK_HTML,
        });
      } else {
        await route.abort();
      }
    });

    registerSearchDocumentation({
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
      name: "searchDocumentation",
      arguments: {
        searchPhrase: MOCK_SEARCH_PHRASE,
      },
    });

    const expectedResults = [
      {
        url: "https://developers.line.biz/en/docs/test",
        title: "Testing Documentation",
        description: "This is a test documentation",
        type: "document",
      },
      {
        url: "https://developers.line.biz/en/faq/test",
        title: "FAQ Question",
        description: "This is a FAQ entry",
        type: "faq",
      },
    ];

    expect(result).toEqual({
      content: expectedResults.map((result) => ({
        type: "text",
        text: JSON.stringify(result),
      })),
    });
  });
});
