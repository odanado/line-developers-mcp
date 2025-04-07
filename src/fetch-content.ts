import { Page } from "playwright";
import { NodeHtmlMarkdown } from "node-html-markdown";

export const fetchContent = async ({
  url,
  page,
}: {
  url: string;
  page: Page;
}) => {
  await page.goto(url, { waitUntil: "networkidle" });

  const rawHtml = await page.$eval(".content__default", (el) => el.innerHTML);

  const article = NodeHtmlMarkdown.translate(rawHtml);

  return article;
};
