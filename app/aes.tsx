const sBox: number[][] = [
  [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b,
    0xfe, 0xd7, 0xab, 0x76,
  ],
  [
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf,
    0x9c, 0xa4, 0x72, 0xc0,
  ],
  [
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1,
    0x71, 0xd8, 0x31, 0x15,
  ],
  [
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2,
    0xeb, 0x27, 0xb2, 0x75,
  ],
  [
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3,
    0x29, 0xe3, 0x2f, 0x84,
  ],
  [
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39,
    0x4a, 0x4c, 0x58, 0xcf,
  ],
  [
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f,
    0x50, 0x3c, 0x9f, 0xa8,
  ],
  [
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21,
    0x10, 0xff, 0xf3, 0xd2,
  ],
  [
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d,
    0x64, 0x5d, 0x19, 0x73,
  ],
  [
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14,
    0xde, 0x5e, 0x0b, 0xdb,
  ],
  [
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62,
    0x91, 0x95, 0xe4, 0x79,
  ],
  [
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea,
    0x65, 0x7a, 0xae, 0x08,
  ],
  [
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f,
    0x4b, 0xbd, 0x8b, 0x8a,
  ],
  [
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9,
    0x86, 0xc1, 0x1d, 0x9e,
  ],
  [
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9,
    0xce, 0x55, 0x28, 0xdf,
  ],
  [
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f,
    0xb0, 0x54, 0xbb, 0x16,
  ],
];
const invSBox: number[][] = [
  [
    0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e,
    0x81, 0xf3, 0xd7, 0xfb,
  ],
  [
    0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44,
    0xc4, 0xde, 0xe9, 0xcb,
  ],
  [
    0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b,
    0x42, 0xfa, 0xc3, 0x4e,
  ],
  [
    0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49,
    0x6d, 0x8b, 0xd1, 0x25,
  ],
  [
    0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc,
    0x5d, 0x65, 0xb6, 0x92,
  ],
  [
    0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57,
    0xa7, 0x8d, 0x9d, 0x84,
  ],
  [
    0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05,
    0xb8, 0xb3, 0x45, 0x06,
  ],
  [
    0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03,
    0x01, 0x13, 0x8a, 0x6b,
  ],
  [
    0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce,
    0xf0, 0xb4, 0xe6, 0x73,
  ],
  [
    0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8,
    0x1c, 0x75, 0xdf, 0x6e,
  ],
  [
    0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e,
    0xaa, 0x18, 0xbe, 0x1b,
  ],
  [
    0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe,
    0x78, 0xcd, 0x5a, 0xf4,
  ],
  [
    0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59,
    0x27, 0x80, 0xec, 0x5f,
  ],
  [
    0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f,
    0x93, 0xc9, 0x9c, 0xef,
  ],
  [
    0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c,
    0x83, 0x53, 0x99, 0x61,
  ],
  [
    0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63,
    0x55, 0x21, 0x0c, 0x7d,
  ],
];
const fixedMatrix: number[][] = [
  [0x02, 0x03, 0x01, 0x01],
  [0x01, 0x02, 0x03, 0x01],
  [0x01, 0x01, 0x02, 0x03],
  [0x03, 0x01, 0x01, 0x02],
];
const invFixedMatrix: number[][] = [
  [0x0e, 0x0b, 0x0d, 0x09],
  [0x09, 0x0e, 0x0b, 0x0d],
  [0x0d, 0x09, 0x0e, 0x0b],
  [0x0b, 0x0d, 0x09, 0x0e],
];
const roundConstants: number[][] = [
  [0x01, 0x00, 0x00, 0x00],
  [0x02, 0x00, 0x00, 0x00],
  [0x04, 0x00, 0x00, 0x00],
  [0x08, 0x00, 0x00, 0x00],
  [0x10, 0x00, 0x00, 0x00],
  [0x20, 0x00, 0x00, 0x00],
  [0x40, 0x00, 0x00, 0x00],
  [0x80, 0x00, 0x00, 0x00],
  [0x1b, 0x00, 0x00, 0x00],
  [0x36, 0x00, 0x00, 0x00],
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

const galoisMultiplication = (a: number, b: number): number => {
  let p = 0;
  while (b) {
    if (b & 1) p ^= a;
    const highBitSet = a & 0x80;
    a = (a << 1) & 0xff;
    if (highBitSet) a ^= 0x1b;
    b = b >> 1;
  }

  return p;
};

const expandKey = (byteBlock, round) => {
  let expandedKeyBlock = [...byteBlock];
  for (let i = 0; i < 4; ++i) {
    const byteToHex = byteBlock[i].toString(16).padStart(2, "0");
    const sBoxRow = hexCharToDecimal(byteToHex[0]);
    const sBoxCol = hexCharToDecimal(byteToHex[1]);
    const sByte = sBox[sBoxRow][sBoxCol];
    expandedKeyBlock[(i + 3) % 4] = sByte ^ roundConstants[round][(i + 3) % 4];
  }

  return expandedKeyBlock;
};

const generateRoundKeys = (key) => {
  let roundKeyBlocks = [];
  let blockIndex = -1;

  for (let i = 0; i < 16; ++i) {
    let keyByteToDecimal = key.charCodeAt(i);
    if (i % 4 == 0) {
      roundKeyBlocks[++blockIndex] = [];
    }
    roundKeyBlocks[blockIndex].push(keyByteToDecimal);
  }

  // for (let i = 0; i < 10; ++i) {
  //   const expandedKey = expandKey(roundKeyBlocks[blockIndex], i);

  //   for (let k = 0; k < 4; ++k) {
  //     roundKeyBlocks[++blockIndex] = [];
  //     for (let j = 0; j < 4; ++j) {
  //       roundKeyBlocks[blockIndex].push(
  //         roundKeyBlocks[blockIndex - 4][j] ^
  //           (k === 0 ? expandedKey[j] : roundKeyBlocks[blockIndex - 1][j])
  //       );
  //     }
  //   }
  // }
  for (let i = 0; i < 10; ++i) {
    const expandedKey = expandKey(roundKeyBlocks[blockIndex], i);
    roundKeyBlocks[++blockIndex] = [];

    for (let j = 0; j < 4; ++j)
      roundKeyBlocks[blockIndex].push(
        roundKeyBlocks[blockIndex - 4][j] ^ expandedKey[j]
      );

    for (let k = 0; k < 3; ++k) {
      roundKeyBlocks[++blockIndex] = [];
      for (let j = 0; j < 4; ++j)
        roundKeyBlocks[blockIndex].push(
          roundKeyBlocks[blockIndex - 4][j] ^ roundKeyBlocks[blockIndex - 1][j]
        );
    }
  }

  return roundKeyBlocks;
};

const subBytesAndShiftRows = (hexBlock) => {
  let newHexBlock = hexBlock.map((row) => [...row]);

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      const byteToHex = hexBlock[i][j].toString(16).padStart(2, "0");
      const sBoxRow = hexCharToDecimal(byteToHex[0]);
      const sBoxCol = hexCharToDecimal(byteToHex[1]);
      const subByte = sBox[sBoxRow][sBoxCol];
      newHexBlock[i][(j - i + 4) % 4] = subByte;
    }
  }

  return newHexBlock;
};

const addRoundKey = (hexBlock, keys) => {
  let newHexBlock = hexBlock.map((row) => [...row]);

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      newHexBlock[i][j] = hexBlock[i][j] ^ keys[j][i];
    }
  }

  return newHexBlock;
};

const mixColumnsAndAddRoundKey = (mat1, mat2, keys) => {
  let mixedBlock = [[], [], [], []];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      mixedBlock[i][j] =
        galoisMultiplication(mat1[i][0], mat2[0][j]) ^
        galoisMultiplication(mat1[i][1], mat2[1][j]) ^
        galoisMultiplication(mat1[i][2], mat2[2][j]) ^
        galoisMultiplication(mat1[i][3], mat2[3][j]) ^
        keys[j][i];
    }
  }

  return mixedBlock;
};

export const aes = (input, key) => {
  const roundKeys = generateRoundKeys(key);
  let byteBlock = [[], [], [], []];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      byteBlock[j][i] = input[i * 4 + j];
    }
  }

  byteBlock = addRoundKey(byteBlock, roundKeys.slice(0, 4));

  for (let round = 1; round < 11; ++round) {
    byteBlock = subBytesAndShiftRows(byteBlock);
    const roundKey = roundKeys.slice(round * 4, (round + 1) * 4);

    if (round < 10) {
      byteBlock = mixColumnsAndAddRoundKey(fixedMatrix, byteBlock, roundKey);
    } else {
      byteBlock = addRoundKey(byteBlock, roundKey);
    }
  }

  // console.log("cipher:", hexBlock);
  let cipher = [];
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      cipher.push(byteBlock[j][i]);
    }
  }

  // console.log("input:", input);
  // console.log("encrypt:", cipher);

  // aesDecrypt(cipher, key);
  return cipher;
};

const invShiftRowAndSubBytes = (hexBlock) => {
  let newHexBlock = hexBlock.map((row) => [...row]);

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      const byteToHex = hexBlock[i][j].toString(16).padStart(2, "0");
      const sBoxRow = hexCharToDecimal(byteToHex[0]);
      const sBoxCol = hexCharToDecimal(byteToHex[1]);
      const subByte = invSBox[sBoxRow][sBoxCol];
      newHexBlock[i][(j + i) % 4] = subByte;
    }
  }

  return newHexBlock;
};

const invMixColumnsAndAddRoundKey = (mat1, mat2, keys) => {
  let mixedBlock = [[], [], [], []];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      mixedBlock[i][j] =
        galoisMultiplication(mat1[i][0], mat2[0][j] ^ keys[j][0]) ^
        galoisMultiplication(mat1[i][1], mat2[1][j] ^ keys[j][1]) ^
        galoisMultiplication(mat1[i][2], mat2[2][j] ^ keys[j][2]) ^
        galoisMultiplication(mat1[i][3], mat2[3][j] ^ keys[j][3]);
    }
  }

  return mixedBlock;
};

export const aesDecrypt = (input, key) => {
  // const keys = generateRoundKeys(key);
  let reversedKeys = [];
  for (let i = keys.length - 4; i >= 0; i -= 4) {
    reversedKeys.push(keys[i], keys[i + 1], keys[i + 2], keys[i + 3]);
  }
  let byteBlock = [[], [], [], []];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      byteBlock[j][i] = input[i * 4 + j];
    }
  }

  byteBlock = addRoundKey(byteBlock, reversedKeys.slice(0, 4));

  for (let round = 1; round < 11; ++round) {
    byteBlock = invShiftRowAndSubBytes(byteBlock);
    const roundKey = reversedKeys.slice(round * 4, (round + 1) * 4);

    if (round < 10) {
      byteBlock = invMixColumnsAndAddRoundKey(
        invFixedMatrix,
        byteBlock,
        roundKey
      );
    } else {
      byteBlock = addRoundKey(byteBlock, roundKey);
    }
  }

  // console.log("plain:", hexBlock);
  let plain = [];
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      plain.push(byteBlock[j][i]);
    }
  }

  // console.log("input:", input);
  // console.log("decrypt:", pixels);
  return plain;
};

export const aes1by1 = (input, key, round) => {
  // const roundKeys = generateRoundKeys(key);
  const roundKeys = keys;
  let byteBlock = [[], [], [], []];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      byteBlock[j][i] = input[i * 4 + j];
    }
  }

  if (round === 0) {
    byteBlock = addRoundKey(byteBlock, roundKeys.slice(0, 4));
  } else {
    // for (let round = 1; round < 11; ++round) {
    byteBlock = subBytesAndShiftRows(byteBlock);
    const roundKey = roundKeys.slice(round * 4, (round + 1) * 4);

    if (round < 10) {
      byteBlock = mixColumnsAndAddRoundKey(fixedMatrix, byteBlock, roundKey);
    } else {
      byteBlock = addRoundKey(byteBlock, roundKey);
    }
  }
  // }

  // console.log("cipher:", hexBlock);
  let cipher = [];
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      cipher.push(byteBlock[j][i]);
    }
  }

  // console.log("input:", input);
  // console.log("encrypt:", cipher);

  // aesDecrypt(cipher, key);
  return cipher;
};
export const aesDecrypt1by1 = (input, key, round) => {
  // const keys = generateRoundKeys(key);
  // const roundKeys = keys
  let reversedKeys = keys;
  // for (let i = keys.length - 4; i >= 0; i -= 4) {
  //   reversedKeys.push(keys[i], keys[i + 1], keys[i + 2], keys[i + 3]);
  // }
  let byteBlock = [[], [], [], []];

  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      byteBlock[j][i] = input[i * 4 + j];
    }
  }

  // for (let round = 1; round < 11; ++round) {
  if (round === 0) {
    byteBlock = addRoundKey(byteBlock, reversedKeys.slice(0, 4));
  } else {
    const roundKey = reversedKeys.slice(round * 4, (round + 1) * 4);
    if (round < 10) {
      byteBlock = invMixColumnsAndAddRoundKey(
        invFixedMatrix,
        byteBlock,
        roundKey
      );
    } else {
      byteBlock = addRoundKey(byteBlock, roundKey);
    }
    byteBlock = invShiftRowAndSubBytes(byteBlock);
  }
  // }

  // console.log("plain:", hexBlock);
  let plain = [];
  for (let i = 0; i < 4; ++i) {
    for (let j = 0; j < 4; ++j) {
      plain.push(byteBlock[j][i]);
    }
  }

  // console.log("input:", input);
  // console.log("decrypt:", pixels);
  return plain;
};

const keys = generateRoundKeys("Thats my Kung Fu");
const keys2 = generateRoundKeys("Thats my Kung Fv");
