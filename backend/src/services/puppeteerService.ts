import puppeteer from "puppeteer";

/**
 * Scrapes a website URL to extract text context.
 */
export const scrapeWebsite = async (url: string): Promise<string> => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();

        // Wait until network is idle or 15 seconds max
        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });

        // Retrieve inner text, strip scripts/styles, reduce whitespace
        const textContent = await page.evaluate(() => {
            // Remove scripts and styles before extracting text
            const scripts = document.querySelectorAll("script, style, noscript");
            scripts.forEach((s) => s.remove());

            return document.body.innerText;
        });

        // Clean up the text content (remove excessive whitespace and newlines)
        const cleanedText = textContent
            .replace(/\n\s*\n/g, "\n")
            .replace(/\t/g, " ")
            .trim();

        return cleanedText;
    } catch (error: any) {
        console.error(`Failed to scrape ${url}:`, error.message);
        throw new Error(`Website scraping failed: ${error.message}`);
    } finally {
        if (browser) await browser.close();
    }
};
