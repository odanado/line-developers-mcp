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
    {
      searchPhrase: z.string().describe("Search phrase"),
      locale: z
        .union([z.literal("en"), z.literal("ja")])
        .describe(
          "A locale of search phrase. Only 'en' and 'ja' are supported",
        ),
      pageNumber: z
        .number()
        .default(1)
        .optional()
        .describe("Page number of pagination"),
    },
    async ({ searchPhrase, locale, pageNumber }) => {
      console.error("INFO: Searching documentation...");
      const results = await searchContent({
        page,
        locale,
        searchPhrase,
        pageNumber,
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
