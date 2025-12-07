require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const {connectMongo, Audit} = require('./models');
const {burnSignatureToPdf, sha256Buffer} = require('./pdfService');

const app = express();
app.use(bodyParser.json({limit:'50mb'}));

connectMongo().then(()=>console.log('Mongo connected')).catch(console.error);

app.post('/api/sign-pdf', async (req, res) => {
  try {
    const {pdfId, signatureBase64, coords, pageNumber} = req.body;
    // for demo load local sample PDF
    const originalPdfBytes = require('fs').readFileSync('./sample.pdf');
    const originalHash = sha256Buffer(originalPdfBytes);

    // Call service to burn signature -> returns finalPdfBytes
    const finalPdfBytes = await burnSignatureToPdf({
      pdfBytes: originalPdfBytes,
      signatureBase64,
      coords, // {xPct,yPct,wPct,hPct}
      pageNumber
    });

    const finalHash = sha256Buffer(finalPdfBytes);

    // save to mongodb audit
    const audit = await Audit.create({
      pdfId,
      pageNumber,
      originalHash,
      finalHash,
      createdAt: new Date()
    });

    // write out file and return URL (in dev we save locally)
    const outPath = `./signed-${Date.now()}.pdf`;
    require('fs').writeFileSync(outPath, finalPdfBytes);
    const url = `http://localhost:4000/${outPath.replace('./','')}`; // for local demo
    return res.json({ok:true, url, auditId: audit._id});
  } catch (err) {
    console.error(err);
    res.status(500).json({ok:false, error:err.message});
  }
});

// serve static signed files (dev only)
app.use(express.static('.'));

const port = process.env.PORT || 4000;
app.listen(port, ()=>console.log('Backend listening on', port));
