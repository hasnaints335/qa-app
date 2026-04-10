import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const shopifyUrl = formData.get('url') as string
    const viewportStr = formData.get('viewport') as string
    const figmaFile = formData.get('figma') as File

    if (!shopifyUrl || !figmaFile) {
      return NextResponse.json({ error: 'Missing URL or image' }, { status: 400 })
    }

    const viewportWidth = parseInt(viewportStr || '1440')
    const viewportHeight = 900

    // --- dynamic imports so they only load server-side ---
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = (await import('puppeteer-core')).default
    const { PNG } = await import('pngjs')
    const pixelmatch = (await import('pixelmatch')).default
    const sharp = (await import('sharp')).default

    // 1. Screenshot Shopify page
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: viewportWidth, height: viewportHeight },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.goto(shopifyUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    const shopifyBuffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: viewportWidth, height: viewportHeight } }) as Buffer
    await browser.close()

    // 2. Read uploaded Figma image
    const figmaBuffer = Buffer.from(await figmaFile.arrayBuffer())

    // 3. Resize both to same size for comparison
    const W = viewportWidth
    const H = viewportHeight

    const [shopifyResized, figmaResized] = await Promise.all([
      sharp(shopifyBuffer).resize(W, H, { fit: 'cover' }).png().toBuffer(),
      sharp(figmaBuffer).resize(W, H, { fit: 'cover' }).png().toBuffer(),
    ])

    // 4. Run pixelmatch
    const img1 = PNG.sync.read(figmaResized)
    const img2 = PNG.sync.read(shopifyResized)
    const diff = new PNG({ width: W, height: H })
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, W, H, { threshold: 0.1 })
    const diffBuffer = PNG.sync.write(diff)

    const total = W * H
    const matchScore = Math.round(((total - numDiffPixels) / total) * 100)

    return NextResponse.json({
      matchScore,
      diffPixels: numDiffPixels,
      passed: matchScore >= 90,
      shopifyScreenshot: 'data:image/png;base64,' + shopifyBuffer.toString('base64'),
      figmaImage: 'data:image/png;base64,' + figmaBuffer.toString('base64'),
      diffImage: 'data:image/png;base64,' + diffBuffer.toString('base64'),
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Comparison failed' }, { status: 500 })
  }
}
