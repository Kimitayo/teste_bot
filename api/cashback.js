const chrome = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

module.exports = async (req, res) => {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    });

    const page = await browser.newPage();
    await page.goto("https://shopping.inter.co/gift-card", { waitUntil: "networkidle2" });

    const result = await page.evaluate(() => {
      const getCashback = (name) => {
        const card = Array.from(document.querySelectorAll(".cardGiftCard")).find(el =>
          el.innerText.includes(name)
        );
        if (!card) return null;

        const cashbackText = card.innerText.match(/cashback.*?(\d+([.,]\d+)?)/i);
        if (!cashbackText) return null;

        return parseFloat(cashbackText[1].replace(",", "."));
      };

      return {
        uber: getCashback("Uber"),
        zift: getCashback("Zift"),
        xbox: getCashback("Xbox")
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao buscar cashback:", err);
    res.status(500).json({ error: "Erro ao buscar cashback" });
  } finally {
    if (browser) await browser.close();
  }
};
