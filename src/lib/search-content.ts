import type { Page } from "playwright";
import { z } from "zod";

const searchResultSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.union([
    z.literal("news"),
    z.literal("document"),
    z.literal("faq"),
    z.literal("reference"),
  ]),
});

type SearchResult = z.infer<typeof searchResultSchema>;

const BASE_URL = "https://developers.line.biz/";

export const searchContent = async ({
  page,
  locale,
  searchPhrase,
  pageNumber = 1,
}: {
  page: Page;
  locale: string;
  searchPhrase: string;
  pageNumber?: number;
}): Promise<SearchResult[]> => {
  const url = new URL([locale, "search"].join("/"), BASE_URL);

  url.searchParams.set("kw", searchPhrase);
  url.hash = `#page-${pageNumber}`;

  await page.goto(url.toString(), {
    waitUntil: "networkidle",
  });

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
          if (["FAQ"].includes(type)) {
            return "faq";
          } else if (["ドキュメント", "Documentation"].includes(type)) {
            return "document";
          } else if (["ニュース", "News"].includes(type)) {
            return "news";
          } else if (["リファレンス", "Reference"].includes(type)) {
            return "reference";
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

      const url = new URL(parsed.data.url, BASE_URL);
      return { ...parsed.data, url: url.toString() };
    })
    .filter((result): result is SearchResult => result !== undefined);

  console.error("Search results:", results.length);
  return results;
};
