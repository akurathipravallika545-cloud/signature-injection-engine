import React from 'react';
import Draggable from 'react-draggable';
import {ResizableBox} from 'react-resizable';

export default function FieldBox({field, pageViewport, onChange, onSign}) {
  if(!pageViewport) return null;
  const handleDrag = (e, data) => {
    onChange({...field, left: data.x, top: data.y});
  };
  const handleResize = (e, {size}) => {
    onChange({...field, width: size.width, height: size.height});
  };
  const triggerSign = async () => {
    // for demo: use a placeholder base64 image or prompt user to upload
    const sampleSignatureBase64 = await fetch('/sample-signature-base64.txt').then(r => r.text());
    const res = await onSign(field, sampleSignatureBase64);
    alert('Signed PDF URL: ' + res.url);
  };

  return (
    <Draggable bounds="parent" position={{x: field.left, y: field.top}} onDrag={handleDrag}>
      <div style={{position:'absolute', left:0, top:0}}>
        <ResizableBox width={field.width} height={field.height} onResizeStop={handleResize} minConstraints={[40,20]}>
          <div style={{
            width:'100%', height:'100%', border:'2px dashed #007bff',
            background: 'rgba(0,123,255,0.03)', display: 'flex', justifyContent:'center', alignItems:'center'
          }}>
            <div style={{textAlign:'center', fontSize:12}}>
              {field.type}
              <div style={{marginTop:6}}>
                <button onClick={triggerSign}>Burn Signature</button>
              </div>
            </div>
          </div>
        </ResizableBox>
      </div>
    </Draggable>
  );
}
