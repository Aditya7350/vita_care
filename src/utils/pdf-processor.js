import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Processes a PDF by adding a logo and footer on the client side.
 * @param {Object} options
 * @param {File} options.pdfFile - The original PDF file
 * @param {ArrayBuffer} [options.logoBuffer] - Logo image as ArrayBuffer
 * @param {ArrayBuffer} [options.footerBuffer] - Footer image as ArrayBuffer
 * @param {string} [options.footerText] - Footer text
 * @returns {Promise<Uint8Array>}
 */
export async function processPdf({ pdfFile, logoBuffer, footerBuffer, footerText }) {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);

    let logoImage;
    if (logoBuffer) {
        try {
            logoImage = await pdfDoc.embedPng(logoBuffer);
        } catch (e) {
            logoImage = await pdfDoc.embedJpg(logoBuffer);
        }
    }

    let footerImage;
    if (footerBuffer) {
        try {
            footerImage = await pdfDoc.embedPng(footerBuffer);
        } catch (e) {
            footerImage = await pdfDoc.embedJpg(footerBuffer);
        }
    }

    const pages = pdfDoc.getPages();

    for (const page of pages) {
        const { width, height } = page.getSize();
        const HEADER_HEIGHT = 150;

        if (logoImage) {
            const margin = 1;
            const headerTopPadding = 5;
            const maxLogoWidth = 350;
            const maxLogoHeight = 300;

            const { width: imgW, height: imgH } = logoImage.size();

            const scale = Math.min(
                maxLogoWidth / imgW,
                maxLogoHeight / imgH
            );

            const logoWidth = imgW * scale;
            const logoHeight = imgH * scale;
            const headerTopY = height - HEADER_HEIGHT;

            page.drawImage(logoImage, {
                x: width - logoWidth - margin,
                y: headerTopY + (HEADER_HEIGHT - logoHeight) / 2 + headerTopPadding,
                width: logoWidth,
                height: logoHeight,
            });
        }

        const bottomMargin = 20;
        const footerHeight = 850;

        if (footerImage) {
            const { width: fW, height: fH } = footerImage.size();
            const scale = footerHeight / fH;
            const footerWidth = fW * scale;

            page.drawImage(footerImage, {
                x: (width - footerWidth) / 2,
                y: bottomMargin,
                width: footerWidth,
                height: footerHeight,
            });
        } else if (footerText) {
            const footerTextMargin = 30;
            page.drawText(footerText, {
                x: width / 2 - (footerText.length * 3),
                y: footerTextMargin,
                size: 10,
                color: rgb(0.3, 0.3, 0.3)
            });
        }
    }

    return await pdfDoc.save();
}
