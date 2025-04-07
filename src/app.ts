import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium, Page } from "playwright";

import { fetchContent } from "./fetch-content.js";

const browser = await chromium.launch();

export const server = new McpServer({
  name: "LINE Developers MCP Server",
  version: "0.1.0",
});

const searchResultSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.union([z.literal("news"), z.literal("document"), z.literal("faq")]),
});

type SearchResult = z.infer<typeof searchResultSchema>;

const BASE_URL = "https://developers.line.biz/ja/";

const extractSearchResults = async ({
  page,
}: {
  page: Page;
}): Promise<SearchResult[]> => {
  const rawResults = await page.$$eval(
    ".search-result",
    (elements): Array<unknown> => {
      return elements.map((element) => {
        const url = element.querySelector(".result-url")?.textContent?.trim();

        const title = element
          .querySelector(".result-title")
          ?.textContent?.trim();
        const description = element
          .querySelector(".result-body")
          ?.textContent?.trim();

        const type = element.querySelector("div")?.textContent?.trim();
        const getType = (type: string | undefined) => {
          if (!type) {
            return undefined;
          }
          if (type.includes("FAQ")) {
            return "faq";
          } else if (type.includes("ドキュメント")) {
            return "document";
          } else if (type.includes("ニュース")) {
            return "news";
          }
          console.error("Unknown type:", type);
          return undefined;
        };

        return {
          url,
          title,
          description,
          type: getType(type),
        };
      });
    },
  );

  const results = rawResults
    .map((result) => {
      const parsed = searchResultSchema.safeParse(result);

      if (!parsed.success) {
        console.error("Failed to parse search result:", parsed.error);
        return undefined;
      }

      return { ...parsed.data, url: BASE_URL + parsed.data.url };
    })
    .filter((result): result is SearchResult => result !== undefined);

  console.error("Search results:", results);
  return results;
};

server.tool(
  "readDocumentation",
  "Read documentation in the LINE Developers site",
  {
    url: z.string().describe("URL of the documentation"),
  },
  async ({ url }) => {
    const page = await browser.newPage();
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

server.tool(
  "searchDocumentation",
  "Search documentation in the LINE Developers site",
  { searchPhrase: z.string().describe("Search phrase") },
  async ({ searchPhrase }) => {
    const SEARCH_URL = `${BASE_URL}search/`;
    const url = new URL(SEARCH_URL);
    url.searchParams.set("kw", searchPhrase);
    url.hash = "#page-1";

    const page = await browser.newPage();
    await page.goto(url.toString(), { waitUntil: "networkidle" });

    const result = await extractSearchResults({ page });

    return {
      content: result.map((result) => ({
        type: "text",
        text: JSON.stringify(result),
      })),
    };
  },
);

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
