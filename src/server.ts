import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { chromium, devices } from "playwright";

import { registerReadDocumentation } from "./tools/read-documentation.ts";
import { registerSearchDocumentation } from "./tools/search-documentation.ts";
import { fetchContent } from "./lib/fetch-content.ts";

const VERSION = "0.1.0";

const browser = await chromium.launch();

const deviceSettings = devices["Desktop Chrome"];
const context = await browser.newContext({
  ...deviceSettings,
  userAgent: `${deviceSettings.userAgent} line-developers-mcp/${VERSION}`,
});

const page = await context.newPage();

export const server = new McpServer({
  name: "LINE Developers MCP Server",
  version: VERSION,
});

registerReadDocumentation({ server, page });
registerSearchDocumentation({ server, page });

server.resource(
  "LIFF v2 API reference",
  "https://developers.line.biz/en/reference/liff/",
  async (uri) => {
    // リソース取得用にも同じUA設定を使用
    const resourcePage = await context.newPage();
    const content = await fetchContent({
      url: uri.href,
      page: resourcePage,
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
