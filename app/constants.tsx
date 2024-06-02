import { ref } from "firebase/storage";
import { Dimensions } from "react-native";
import { storage } from "../firebase.config";

export interface ImageDetails {
  pose: string;
  kg: string;
  bf: string;
  date: string;
  extra: string;
}
export const screenWidth = Dimensions.get("window").width;
export const screenHeight = Dimensions.get("window").height;
export const imagesPerRow = 6;
export const imageFolderPath = "images/";
export const smallImageFolderPath = "small_images/";
export const imageDetails: ImageDetails = {
  pose: "",
  kg: "",
  bf: "",
  date: "",
  extra: "",
};
export const keys = Object.keys(imageDetails);
export const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const formatDate = (date) => {
  const splitDate = date.split("/");
  const month = months[parseInt(splitDate[1]) - 1];
  const year = splitDate[2];
  const formattedDate = `${month} - ${year}`;
  return formattedDate;
};
export const getImageRef = (imageUrl) => {
  const encodedPath = encodeURIComponent(imageFolderPath);
  const startIndex = imageUrl.indexOf(encodedPath) + encodedPath.length;
  const endIndex = imageUrl.indexOf("?alt=media");
  const imageId = imageUrl.substring(startIndex, endIndex);
  const imageRef = ref(storage, imageFolderPath + imageId);
  return imageRef;
};
export const getSmallImageRef = (imageUrl) => {
  const encodedPath = encodeURIComponent(smallImageFolderPath);
  const startIndex = imageUrl.indexOf(encodedPath) + encodedPath.length;
  const endIndex = imageUrl.indexOf("?alt=media");
  const imageId = imageUrl.substring(startIndex, endIndex);
  const imageRef = ref(storage, smallImageFolderPath + imageId);
  return imageRef;
};

// img.src = 'data:image/jpeg;base64,${base64string}';
export const loadBase64andSendPixelsScript = (base64string) => {
  // console.log(base64string);
  const script = `
  (function() {
    const img = new Image();
    img.src = img.src = 'data:image/jpeg;base64,${base64string}';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', {alpha: false});
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixelData = Array.from(imageData.data);
      window.ReactNativeWebView.postMessage(JSON.stringify(pixelData));
    };
  })();
`;
  return script;
};
export const loadBase64andSendPixelsScriptWithIndex = (base64string, index) => {
  const script = `
    (function() {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,${base64string}';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', {alpha: false});
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixelData = Array.from(imageData.data);
        pixelData.push(${index})
        window.ReactNativeWebView.postMessage(JSON.stringify(pixelData));
      };
    })();
  `;
  return script;
};
export const loadPixelsAndSendNewBase64Script = (
  oldBase64string,
  newPixels
) => {
  const script = `
  (function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {alpha: false});
    const img = new Image();
    img.src = 'data:image/jpeg;base64,${oldBase64string}';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const imageData = ctx.createImageData(img.width, img.height);
      const pixelData = ${newPixels};
      for (let i = 0; i < pixelData.length - 1; i++) {
        imageData.data[i] = pixelData[i];
      }
      ctx.putImageData(imageData, 0, 0);
      const newBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
      window.ReactNativeWebView.postMessage(JSON.stringify(newBase64));
    };
  })();
`;
  return script;
};
