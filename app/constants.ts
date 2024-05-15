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
export const imageDetails: ImageDetails = {
  pose: "",
  kg: "",
  bf: "",
  date: "",
  extra: "",
};
export const keys: string[] = Object.keys(imageDetails);
export const date: Date = new Date(Date.now());

// got the dimension from the trained data of the *Teachable Machine*; pixel resolution conversion (8x)
export const BITMAP_DIMENSION = 224;
export const TENSORFLOW_CHANNEL = 3;
export const RESULT_MAPPING = ["Pull up", "Dip", "Push up"];
