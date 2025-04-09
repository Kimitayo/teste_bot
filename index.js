import puppeteer from "puppeteer";
import express from "express";

const app = express();

app.get("/", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  await page.goto("https://shopping.inter.co/gift-card", { waitUntil: "networkidle0" });

  const result = await page.evaluate(() => {
    const cards = document.querySelectorAll(".card-body");
    const data = {
      uber: null,
      zift: null,
      xbox: null
    };

    cards.forEach(card => {
      const title = card.querySelector(".title")?.innerText.trim();
      const cashbackEl = card.querySelector(".cashback span");
      const cashback = cashbackEl ? cashbackEl.innerText.replace(",", ".").replace("%", "") : null;

      if (title && cashback) {
        if (/uber/i.test(title)) data.uber = parseFloat(cashback);
        else if (/zift/i.test(title)) data.zift = parseFloat(cashback);
        else if (/xbox/i.test(title)) data.xbox = parseFloat(cashback);
      }
    });

    return data;
  });

  await browser.close();
  res.json(result);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
