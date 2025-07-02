// function/ImageHTML.js
import puppeteer from 'puppeteer';
let browser

export async function startBrowser() {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
}
/**
 * Recibe un HTML completo y escribe un PNG en outputPath.
 */
export async function generarImagen(htmlContent, outputPath) {

  const page = await browser.newPage()

  try {
    await page.setViewport({ width: 1100, height: 600, deviceScaleFactor: 2 })
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('screen');
    await page.screenshot({ path: outputPath, fullPage: true})
  } finally{
    await page.close()
  }
}
