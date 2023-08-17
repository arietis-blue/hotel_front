import React, { useRef, useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function DrawingCanvas({ backgroundImage, onMaskImage }) {
  const backgroundCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [erasing, setErasing] = useState(false);
  const [lineWidth, setLineWidth] = useState(5);
  const [mask_Image, setMaskImage] = useState(null);

  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    drawingCanvas.width = 512;
    drawingCanvas.height = 512;
    backgroundCanvas.width = 512;
    backgroundCanvas.height = 512;

    const backgroundCtx = backgroundCanvas.getContext('2d');
    const drawingCtx = drawingCanvas.getContext('2d');

    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => {
        backgroundCtx.drawImage(img, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
      };
    } else {
      backgroundCtx.fillStyle = 'white';
      backgroundCtx.fillRect(0, 0, 512, 512);
    }

    drawingCtx.strokeStyle = 'black';
    drawingCtx.lineWidth = 5;
    ctxRef.current = drawingCtx;
  }, [backgroundImage]);

  const invertColors = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];     // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const saveImage = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 512;
    tempCanvas.height = 512;
    const tempCtx = tempCanvas.getContext('2d');
  
    // 背景を白で塗りつぶす
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  
    // // 背景画像を上書き（もし存在すれば）
    // tempCtx.drawImage(backgroundCanvasRef.current, 0, 0);
  
    // 描かれた線を上書き
    tempCtx.drawImage(drawingCanvasRef.current, 0, 0);

    // invertColors(tempCtx, 512, 512);
  
    // 画像をデータURLとして保存
    const dataURL = tempCanvas.toDataURL('image/png');
    setMaskImage(dataURL);
  
    // 親コンポーネントに画像データを渡す
    if (onMaskImage) {
      onMaskImage(dataURL);
    }
  };
  


  const handleMouseDown = () => {
    ctxRef.current.beginPath();
    drawingCanvasRef.current.addEventListener('mousemove', handleMouseMove);
  };

  const handleMouseUp = () => {
    drawingCanvasRef.current.removeEventListener('mousemove', handleMouseMove);
    ctxRef.current.closePath();
  };

  const handleMouseMove = (event) => {
    const x = event.clientX - drawingCanvasRef.current.getBoundingClientRect().left;
    const y = event.clientY - drawingCanvasRef.current.getBoundingClientRect().top;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const toggleEraser = () => {
    setErasing(prevErasing => {
      const newErasing = !prevErasing;
      ctxRef.current.globalCompositeOperation = newErasing ? 'destination-out' : 'source-over';
      ctxRef.current.strokeStyle = newErasing ? 'rgba(0,0,0,1)' : 'black'; // 透明度を1に設定
      ctxRef.current.lineWidth = newErasing ? 15 : lineWidth;
      return newErasing;
    });
  };

  const handleLineWidthChange = (event) => {
    const value = event.target.value;
    setLineWidth(value);
    ctxRef.current.lineWidth = erasing ? 15 : value;
  };

  return (
    <div>
      <canvas ref={backgroundCanvasRef} style={{ position: 'absolute' }} />
      <canvas
        ref={drawingCanvasRef}
        width={400}
        height={400}
        style={{ position: 'relative', border: '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      <button onClick={toggleEraser}>{erasing ? 'Brush' : 'Eraser'}</button>
      <label>
        Line Width:
        <input type="range" min="1" max="20" value={lineWidth} onChange={handleLineWidthChange} />
      </label>
      <button onClick={saveImage}>Save as Image</button>
      {/* {mask_Image && <img src={mask_Image} alt="保存した画像" />} */}
    </div>
  );
}

export default DrawingCanvas;
