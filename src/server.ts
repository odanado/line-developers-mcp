import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { chromium } from "playwright";

import { registerReadDocumentation } from "./tools/read-documentation.ts";
import { registerSearchDocumentation } from "./tools/search-documentation.ts";
import { fetchContent } from "./lib/fetch-content.ts";

const browser = await chromium.launch();

export const server = new McpServer({
  name: "LINE Developers MCP Server",
  version: "0.1.0",
});

const page = await browser.newPage();
registerReadDocumentation({ server, page });
registerSearchDocumentation({ server, page });

server.resource(
  "LIFF v2 API reference",
  "https://developers.line.biz/en/reference/liff/",
  async (uri) => {
    const page = await browser.newPage();
    const content = await fetchContent({
      url: uri.href,
      page,
    });
    return {
      contents: [
        {
          uri: uri.href,
          text: content,
        },
      ],
    };
  },
);
