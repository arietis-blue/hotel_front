import React, { useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import 'bootstrap/dist/css/bootstrap.min.css';

export const ImageCrop = ({ onCropped }) => {
  const [crop, setCrop] = useState({ aspect: 1 });
  const [imageSrc, setImageSrc] = useState(null);

  const onCrop = async () => {
    const imageRef = document.getElementById('rawImage');
    if (imageRef && crop.width && crop.height) {
      const croppedImageUrl = await getCroppedImg(imageRef, crop);
      console.log("切り抜かれた画像のbase64データ: ", croppedImageUrl);
      onCropped(croppedImageUrl); // 親へ通知
    }
  };

  const onImageUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.src = reader.result;
      image.onload = () => {
        const canvas = prepareImageForCrop(image);
        setImageSrc(canvas.toDataURL());
      };
    };
    reader.readAsDataURL(file);
  };

  const prepareImageForCrop = (image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const size = Math.max(image.width, image.height);
    canvas.width = size;
    canvas.height = size;

    const offsetX = (size - image.width) / 2;
    const offsetY = (size - image.height) / 2;
    ctx.drawImage(image, offsetX, offsetY, image.width, image.height);

    return canvas;
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const pixelRatio = 1;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    const size = 512;

    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      size * pixelRatio,
      size * pixelRatio
    );

    return canvas.toDataURL('image/jpeg', 1.0);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onImageUpload} />
      {imageSrc && (
        <div>
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            aspect={1}
          >
            <img src={imageSrc} id="rawImage" alt="クロップする画像" />
          </ReactCrop>
          <button onClick={onCrop}>選択範囲で切り抜く</button>
        </div>
      )}
    </div>
  );
};

export default ImageCrop;
