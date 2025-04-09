import puppeteer from "puppeteer";
import cheerio from "cheerio";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = "8158695370:AAGorpT7ifG4NmLqKbuCo3ZbI9Dt1xQg0bE";
const CHAT_ID = "-4605247252";
const bot = new TelegramBot(TELEGRAM_TOKEN);

const urls = [
  { name: "Zift", url: "https://marketplace.bancointer.com.br/gift-card/zift---cartao-multimarcas-1754" },
  { name: "Uber", url: "https://marketplace.bancointer.com.br/gift-card/uber-1636" },
  { name: "Xbox", url: "https://marketplace.bancointer.com.br/gift-card/xbox-1641" },
];

const previousCashbacks = {};

export default async function handler(req, res) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();

  const updates = [];

  for (const { name, url } of urls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const html = await page.content();
    const $ = cheerio.load(html);

    const cashbackText = $("span[class*='CashbackValue']").text().trim();
    const cashback = cashbackText || "Sem cashback";

    if (previousCashbacks[name] && previousCashbacks[name] !== cashback) {
      updates.push(`⚠️ Cashback alterado para ${name}!\nDe: ${previousCashbacks[name]}\nPara: ${cashback}\n🔗 ${url}`);
    }

    previousCashbacks[name] = cashback;
  }

  await browser.close();

  if (updates.length > 0) {
    for (const msg of updates) {
      await bot.sendMessage(CHAT_ID, msg);
    }
  }

  res.status(200).json({ success: true, updates });
}
