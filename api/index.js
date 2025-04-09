import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  try {
    const executablePath = await chromium.executablePath;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto('https://intershop.bancointer.com.br');

    const content = await page.content();
    await browser.close();

    res.status(200).json({ html: content });
  } catch (error) {
    console.error('Erro ao iniciar o Puppeteer:', error);
    res.status(500).json({ error: 'Erro ao iniciar o Puppeteer', details: error.message });
  }
}
