const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('UNCAUGHT EXCEPTION:', error.message);
  });

  await page.goto('http://localhost:5174/admin', { waitUntil: 'networkidle2' });
  
  // click on the 'cadastrar-anuncio' tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const tab = tabs.find(t => t.textContent.includes('Cadastrar Anúncio'));
    if (tab) tab.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
