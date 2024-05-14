import { Dimensions } from "react-native";

export interface ImageDetails {
  pose: string;
  kg: string;
  bf: string;
  date: string;
  extra: string;
}
export const screenWidth: number = Dimensions.get("window").width;
export const screenHeight: number = Dimensions.get("window").height;
export const imageFolderPath: string = "images/";
export const imageDetails: ImageDetails = {
  pose: "",
  kg: "",
  bf: "",
  date: "",
  extra: "",
};
export const keys: string[] = Object.keys(imageDetails);
