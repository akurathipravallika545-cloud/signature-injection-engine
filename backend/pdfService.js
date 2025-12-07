const { PDFDocument } = require('pdf-lib');
const Buffer = require('buffer').Buffer;

function base64DataToUint8Array(b64) {
  const data = b64.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(data, 'base64');
  return buf;
}
function sha256Buffer(buf) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function burnSignatureToPdf({pdfBytes, signatureBase64, coords, pageNumber=1}) {
  // coords: {xPct,yPct,wPct,hPct}
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const pageIdx = pageNumber - 1;
  const page = pages[pageIdx];
  const {width: pdfWidthPts, height: pdfHeightPts} = page.getSize();

  // compute PDF box in points (math from earlier)
  const boxX = coords.xPct * pdfWidthPts;
  const boxW = coords.wPct * pdfWidthPts;
  const boxH = coords.hPct * pdfHeightPts;
  const boxY = pdfHeightPts - (coords.yPct * pdfHeightPts) - boxH;

  // embed image
  const imgBytes = base64DataToUint8Array(signatureBase64);
  // detect PNG or JPG
  const isPng = signatureBase64.startsWith('data:image/png');
  const embedded = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
  const {width: imgW, height: imgH} = embedded.scale(1);

  // compute scaled size to fit into box preserving aspect ratio
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  // center inside box
  const offsetX = boxX + (boxW - drawW) / 2;
  const offsetY = boxY + (boxH - drawH) / 2;

  page.drawImage(embedded, {
    x: offsetX,
    y: offsetY,
    width: drawW,
    height: drawH,
  });

  const finalBytes = await pdfDoc.save();
  return finalBytes;
}

module.exports = {burnSignatureToPdf, sha256Buffer};
