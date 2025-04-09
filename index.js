import express from 'express';
import puppeteer from 'puppeteer';
import TelegramBot from 'node-telegram-bot-api';
import cheerio from 'cheerio';

const app = express();
const port = process.env.PORT || 3000;

// Substitua com seus valores reais
const TELEGRAM_TOKEN = '8158695370:AAGorpT7ifG4NmLqKbuCo3ZbI9Dt1xQg0bE';
const TELEGRAM_CHAT_ID = '-4605247252';
const URL = 'https://www.bancointer.com.br/cashback/';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

let ultimoCashback = {};

async function buscarCashbacks() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });

  const html = await page.content();
  const $ = cheerio.load(html);

  const produtos = [];

  $('div[data-testid="gift-card"]').each((_, el) => {
    const nome = $(el).find('span.GiftCardstyles__GiftCardName-sc-l5wiub-4').text().trim();
    const valor = $(el).find('span.GiftCardstyles__CashbackValue-sc-l5wiub-5').text().trim() || 'Sem cashback';
    if (nome) produtos.push({ nome, valor });
  });

  await browser.close();
  return produtos;
}

async function verificarMudancas() {
  try {
    const produtos = await buscarCashbacks();
    const mensagens = [];

    for (const p of produtos) {
      const anterior = ultimoCashback[p.nome];
      if (!anterior || anterior !== p.valor) {
        mensagens.push(`🔄 ${p.nome} mudou de "${anterior || 'N/A'}" para "${p.valor}"`);
        ultimoCashback[p.nome] = p.valor;
      }
    }

    if (mensagens.length > 0) {
      const mensagemFinal = mensagens.join('\n');
      await bot.sendMessage(TELEGRAM_CHAT_ID, `📢 Alterações no cashback:\n\n${mensagemFinal}`);
      console.log('Notificação enviada.');
    } else {
      console.log('Nenhuma alteração detectada.');
    }
  } catch (err) {
    console.error('Erro ao verificar cashback:', err);
  }
}

// Rota manual
app.get('/', async (req, res) => {
  await verificarMudancas();
  res.send('Verificação executada.');
});

// Verificação automática a cada 5 minutos
setInterval(verificarMudancas, 5 * 60 * 1000);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
