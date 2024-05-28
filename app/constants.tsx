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
