const sBox: string[][] = [
  [
    "63",
    "7c",
    "77",
    "7b",
    "f2",
    "6b",
    "6f",
    "c5",
    "30",
    "01",
    "67",
    "2b",
    "fe",
    "d7",
    "ab",
    "76",
  ],
  [
    "ca",
    "82",
    "c9",
    "7d",
    "fa",
    "59",
    "47",
    "f0",
    "ad",
    "d4",
    "a2",
    "af",
    "9c",
    "a4",
    "72",
    "c0",
  ],
  [
    "b7",
    "fd",
    "93",
    "26",
    "36",
    "3f",
    "f7",
    "cc",
    "34",
    "a5",
    "e5",
    "f1",
    "71",
    "d8",
    "31",
    "15",
  ],
  [
    "04",
    "c7",
    "23",
    "c3",
    "18",
    "96",
    "05",
    "9a",
    "07",
    "12",
    "80",
    "e2",
    "eb",
    "27",
    "b2",
    "75",
  ],
  [
    "09",
    "83",
    "2c",
    "1a",
    "1b",
    "6e",
    "5a",
    "a0",
    "52",
    "3b",
    "d6",
    "b3",
    "29",
    "e3",
    "2f",
    "84",
  ],
  [
    "53",
    "d1",
    "00",
    "ed",
    "20",
    "fc",
    "b1",
    "5b",
    "6a",
    "cb",
    "be",
    "39",
    "4a",
    "4c",
    "58",
    "cf",
  ],
  [
    "d0",
    "ef",
    "aa",
    "fb",
    "43",
    "4d",
    "33",
    "85",
    "45",
    "f9",
    "02",
    "7f",
    "50",
    "3c",
    "9f",
    "a8",
  ],
  [
    "51",
    "a3",
    "40",
    "8f",
    "92",
    "9d",
    "38",
    "f5",
    "bc",
    "b6",
    "da",
    "21",
    "10",
    "ff",
    "f3",
    "d2",
  ],
  [
    "cd",
    "0c",
    "13",
    "ec",
    "5f",
    "97",
    "44",
    "17",
    "c4",
    "a7",
    "7e",
    "3d",
    "64",
    "5d",
    "19",
    "73",
  ],
  [
    "60",
    "81",
    "4f",
    "dc",
    "22",
    "2a",
    "90",
    "88",
    "46",
    "ee",
    "b8",
    "14",
    "de",
    "5e",
    "0b",
    "db",
  ],
  [
    "e0",
    "32",
    "3a",
    "0a",
    "49",
    "06",
    "24",
    "5c",
    "c2",
    "d3",
    "ac",
    "62",
    "91",
    "95",
    "e4",
    "79",
  ],
  [
    "e7",
    "c8",
    "37",
    "6d",
    "8d",
    "d5",
    "4e",
    "a9",
    "6c",
    "56",
    "f4",
    "ea",
    "65",
    "7a",
    "ae",
    "08",
  ],
  [
    "ba",
    "78",
    "25",
    "2e",
    "1c",
    "a6",
    "b4",
    "c6",
    "e8",
    "dd",
    "74",
    "1f",
    "4b",
    "bd",
    "8b",
    "8a",
  ],
  [
    "70",
    "3e",
    "b5",
    "66",
    "48",
    "03",
    "f6",
    "0e",
    "61",
    "35",
    "57",
    "b9",
    "86",
    "c1",
    "1d",
    "9e",
  ],
  [
    "e1",
    "f8",
    "98",
    "11",
    "69",
    "d9",
    "8e",
    "94",
    "9b",
    "1e",
    "87",
    "e9",
    "ce",
    "55",
    "28",
    "df",
  ],
  [
    "8c",
    "a1",
    "89",
    "0d",
    "bf",
    "e6",
    "42",
    "68",
    "41",
    "99",
    "2d",
    "0f",
    "b0",
    "54",
    "bb",
    "16",
  ],
];

const rCon = ["01", "02", "04", "08", "10", "20", "40", "80", "1b", "36"];

const fixedMatrix = [
  [2, 3, 1, 1],
  [1, 2, 3, 1],
  [1, 1, 2, 3],
  [3, 1, 1, 2],
];

const hexCharToDecimal = (hexChar: string): number => {
  hexChar = hexChar.toLowerCase();

  if (hexChar >= "0" && hexChar <= "9") {
    return parseInt(hexChar, 10); // '0'-'9' to 0-9
  } else if (hexChar >= "a" && hexChar <= "f") {
    return hexChar.charCodeAt(0) - "a".charCodeAt(0) + 10; // 'a'-'f' to 10-15
  } else {
    throw new Error(`Invalid hexadecimal character: ${hexChar}`);
  }
};

const gmul2 = (hex: string): string => {
  const firstBinaryChar = parseInt(hex[0], 16).toString(2).padStart(4, "0");
  const highBit = firstBinaryChar[0];

  const decimalValue = parseInt(hex, 16);
  let multipliedValue = decimalValue * 2;
  if (highBit[0] == "1") {
    multipliedValue -= 256;
    return xorHexValues(multipliedValue.toString(16), "1b");
  }
  return multipliedValue.toString(16);
};

const gmul3 = (hex: string): string => {
  return xorHexValues(hex, gmul2(hex));
};

const multiplyHexByN = (n: number, hex: string): string => {
  if (n == 3) return gmul3(hex);
  if (n == 2) return gmul2(hex);

  return hex;
};

const xorHexValues = (hex1, hex2): string => {
  // Validate the inputs
  if (!/^[\da-fA-F]+$/.test(hex1) || !/^[\da-fA-F]+$/.test(hex2)) {
    console.log(hex1, hex2);
    throw new Error("Invalid hexadecimal input");
  }

  // Convert the hexadecimal strings to decimal numbers
  const decimalValue1 = parseInt(hex1, 16);
  const decimalValue2 = parseInt(hex2, 16);

  // Perform the XOR operation between the decimal numbers
  const xorResult = decimalValue1 ^ decimalValue2;

  // Convert the result back to a hexadecimal string
  const hexResult = xorResult.toString(16);

  return hexResult;
};

const mixColumns = (mat1, mat2) => {
  let mixedBlock: string[][] = [];
  mixedBlock[0] = [];
  mixedBlock[1] = [];
  mixedBlock[2] = [];
  mixedBlock[3] = [];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      let a = multiplyHexByN(mat1[i][0], mat2[0][j]);
      for (let k = 1; k < 4; ++k) {
        const b = multiplyHexByN(mat1[i][k], mat2[k][j]);
        a = xorHexValues(a, b);
      }
      mixedBlock[i][j] = a.padStart(2, "0");
    }
  }

  return mixedBlock;
};

const addRoundCon = (w, c) => {
  const decimalValue1 = parseInt(w, 16);
  const decimalValue2 = parseInt(c, 16);
  const addResult = decimalValue1 ^ decimalValue2;

  // Convert the result back to a hexadecimal string
  const hexResult = addResult.toString(16).padStart(2, "0");
  return hexResult;
};

const g = (w, round) => {
  const p = w[0];
  let ww = [...w];
  for (let i = 0; i < 4; i++) {
    if (i < 3) ww[i] = ww[i + 1];
    else ww[i] = p;
    const sBoxRow = hexCharToDecimal(ww[i][0]);
    const sBoxCol = hexCharToDecimal(ww[i][1]);
    const subByte = sBox[sBoxRow][sBoxCol];
    ww[i] = subByte;
  }
  ww[0] = addRoundCon(ww[0], rCon[round - 1]);
  return ww;
};

const generateKeys = (key) => {
  let keys = [];
  let w: string[][] = [];
  let index = 0;
  for (let i = 0; i < 16; ++i) {
    let keyByteToHex = key.charCodeAt(i).toString(16).padStart(2, "0");
    if (i % 4 == 0) {
      w[Math.floor(i / 4)] = [];
      index++;
    }
    w[Math.floor(i / 4)].push(keyByteToHex);
  }
  let keyIndex = 0;
  let x = "";
  for (let i = 0; i < 4; ++i) for (let j = 0; j < 4; j++) x += w[i][j];
  keys[keyIndex++] = x;

  for (let i = 0; i < 10; ++i) {
    const gw = g(w[index - 1], keyIndex);
    w[index] = [];
    for (let j = 0; j < 4; ++j)
      w[index].push(xorHexValues(w[index - 4][j], gw[j]).padStart(2, "0"));
    for (let k = 0; k < 3; k++) {
      index++;
      w[index] = [];
      for (let j = 0; j < 4; ++j)
        w[index].push(
          xorHexValues(w[index - 1][j], w[index - 4][j]).padStart(2, "0")
        );
    }
    index++;
    let x = "";
    for (let i = index - 4; i < index; ++i)
      for (let j = 0; j < 4; j++) x += w[i][j];
    keys[keyIndex++] = x;
  }
  console.log("------------------------");
  for (let k of keys) console.log(k);
  return w;
};

const shiftRows = (hexBlock) => {
  let newHexBlock = hexBlock.map((row) => [...row]);
  for (let i = 1; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      newHexBlock[i][j] = hexBlock[i][(j + i) % 4];
    }
  }

  return newHexBlock;
};

const subBytes = (hexBlock) => {
  let newHexBlock = hexBlock.map((row) => [...row]);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const sBoxRow = hexCharToDecimal(hexBlock[i][j][0]);
      const sBoxCol = hexCharToDecimal(hexBlock[i][j][1]);
      const subByte = sBox[sBoxRow][sBoxCol];
      //sub + shift
      //   hexBlock[j][(i + 4 - j) % 4] = subByte;
      newHexBlock[i][j] = subByte;
    }
  }

  return newHexBlock;
};

const addRoundKey = (hexBlock, keys, round) => {
  let newHexBlock = hexBlock.map((row) => [...row]);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      newHexBlock[i][j] = xorHexValues(
        hexBlock[i][j],
        keys[j + round * 4][i]
      ).padStart(2, "0");
    }
  }

  return newHexBlock;
};

export const aes = (input, key) => {
  const keys = generateKeys(key);

  let hexBlock: string[][] = [];
  hexBlock[0] = [];
  hexBlock[1] = [];
  hexBlock[2] = [];
  hexBlock[3] = [];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      let inputByteToHex = input[i * 4 + j].toString(16).padStart(2, "0");
      //   const sBoxRow = hexCharToDecimal(inputToHex[0]);
      //   const sBoxCol = hexCharToDecimal(inputToHex[1]);
      //   const subByte = sBox[sBoxRow][sBoxCol];
      //   hexBlock[j][i] = subByte;
      //   //sub + shift
      //   //   hexBlock[j][(i + 4 - j) % 4] = subByte;
      hexBlock[j][i] = inputByteToHex;
    }
  }
  console.log("round:", 0);
  console.log("hex:", hexBlock);
  hexBlock = addRoundKey(hexBlock, keys, 0);
  console.log("add:", hexBlock);

  for (let round = 1; round < 11; round++) {
    console.log("round:", round);
    hexBlock = subBytes(hexBlock);
    console.log("sub:", hexBlock);

    hexBlock = shiftRows(hexBlock);
    console.log("sft:", hexBlock);

    if (round < 10) {
      hexBlock = mixColumns(fixedMatrix, hexBlock);
      console.log("mix:", hexBlock);
    }

    hexBlock = addRoundKey(hexBlock, keys, round);
    console.log("add:", hexBlock);

    console.log();
  }
  console.log("cipher:", hexBlock);
  let pixels = [];
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      pixels.push(parseInt(hexBlock[j][i], 16));
    }
  }
  console.log("input:", input);
  console.log("encrypt:", pixels);
  //   for (let i = 0; i < 4; i++) {
  //     for (let j = 0; j < 4; j++) {
  //       const r = hexBlock[i][j];
  //       hexBlock[i][j] = xorHexValues(hexBlock[i][j], keys[j][i]);
  //       //   console.log(r, "^", keys[j][i], "=", hexBlock[i][j]);
  //     }
  //   }
  //   console.log(hexBlock);
};
