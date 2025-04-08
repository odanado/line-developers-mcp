import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Page } from "playwright";
import { z } from "zod";
import { fetchContent } from "../lib/fetch-content.ts";

export const registerReadDocumentation = ({
  server,
  page,
}: {
  server: McpServer;
  page: Page;
}) => {
  server.tool(
    "readDocumentation",
    "Read documentation in the LINE Developers site",
    {
      url: z.string().describe("URL of the documentation"),
    },
    async ({ url }) => {
      const content = await fetchContent({
        url,
        page,
      });

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    },
  );
};
