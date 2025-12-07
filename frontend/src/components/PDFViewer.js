import React, {useEffect, useRef, useState} from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import FieldBox from './FieldBox';
import {toNormalized} from './utils/coords';
import axios from 'axios';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfViewer({pdfUrl}) {
  const canvasRef = useRef();
  const containerRef = useRef();
  const [pageViewport, setPageViewport] = useState(null); // {w,h,scale}
  const [fields, setFields] = useState([]); // {id, type, left, top, width, height, pageNumber}
  const [pdfMeta, setPdfMeta] = useState(null); // {pdfWidthPts, pdfHeightPts, pageNumber}
  useEffect(() => {
    let loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise.then(async (pdf) => {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({scale: 1.2}); // initial scale
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({canvasContext: ctx, viewport}).promise;
      setPageViewport({w: viewport.width, h: viewport.height, scale: viewport.scale});
      // PDF page size in points:
      const pdfPageInfo = page.getViewport({scale: 1}); // scale 1 gives points? pdf.js default units are CSS px but we can ask page.view
      const [x1,y1,x2,y2] = page.view; // page.view returns [llx, lly, urx, ury] in PDF units (points)
      const pdfWidthPts = Math.abs(x2 - x1);
      const pdfHeightPts = Math.abs(y2 - y1);
      setPdfMeta({pdfWidthPts, pdfHeightPts, pageNumber: 1});
    });
  }, [pdfUrl]);

  function addField(type) {
    // create a default sized field centered
    const defaultW = pageViewport ? pageViewport.w * 0.2 : 200;
    const defaultH = pageViewport ? pageViewport.h * 0.08 : 50;
    const left = pageViewport ? (pageViewport.w - defaultW) / 2 : 100;
    const top = pageViewport ? (pageViewport.h - defaultH) / 2 : 100;
    const field = {
      id: Date.now(),
      type,
      left, top, width: defaultW, height: defaultH,
      pageNumber: 1
    };
    setFields(f => [...f, field]);
  }

  function updateField(updated) {
    setFields(f => f.map(x => x.id === updated.id ? updated : x));
  }

  async function sendForSigning(field, signatureBase64) {
    if (!pdfMeta) return;
    // compute normalized coords
    const norm = toNormalized(
      {left: field.left, top: field.top, width: field.width, height: field.height},
      {w: pageViewport.w, h: pageViewport.h}
    );
    const payload = {
      pdfId: 'sample.pdf', // placeholder
      pageNumber: field.pageNumber,
      coords: norm,
      signatureBase64 // data:image/png;base64,...
    };
    const res = await axios.post('/api/sign-pdf', payload); // adjust base URL for deployed backend
    return res.data;
  }

  return (
    <div>
      <div style={{display:'flex', gap:12, marginBottom:8}}>
        <button onClick={()=>addField('signature')}>Add Signature</button>
        <button onClick={()=>addField('text')}>Add Text</button>
        <button onClick={()=>addField('date')}>Add Date</button>
      </div>
      <div ref={containerRef} style={{position:'relative', width: pageViewport?.w || 800, height: pageViewport?.h || 1000}}>
        <canvas ref={canvasRef} style={{display:'block', width:'100%', height:'100%'}} />
        {fields.map(field => (
          <FieldBox key={field.id} field={field} pageViewport={pageViewport} onChange={updateField} onSign={sendForSigning} />
        ))}
      </div>
    </div>
  );
}

