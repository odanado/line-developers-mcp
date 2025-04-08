import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Page } from "playwright";
import { z } from "zod";
import { searchContent } from "../lib/search-content.ts";

export const registerSearchDocumentation = ({
  server,
  page,
}: {
  server: McpServer;
  page: Page;
}) => {
  server.tool(
    "searchDocumentation",
    "Search documentation in the LINE Developers site",
    { searchPhrase: z.string().describe("Search phrase") },
    async ({ searchPhrase }) => {
      const results = await searchContent({
        page,
        locale: "en",
        searchPhrase,
        pageNumber: 1,
      });

      return {
        content: results.map((result) => ({
          type: "text",
          text: JSON.stringify(result),
        })),
      };
    },
  );
};
