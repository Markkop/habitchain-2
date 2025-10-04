import { stringToHex, hexToString } from "viem";

/**
 * Convert text to bytes32 format for smart contract
 */
export const textToBytes32 = (text: string): `0x${string}` => {
  const trimmed = text.slice(0, 32);
  return stringToHex(trimmed, { size: 32 });
};

/**
 * Convert bytes32 from smart contract back to readable text
 */
export const bytes32ToText = (bytes32: string): string => {
  try {
    return hexToString(bytes32 as `0x${string}`, { size: 32 }).replace(
      /\0/g,
      ""
    );
  } catch {
    return "";
  }
};

/**
 * Parse daily status flags from contract
 */
export const parseDailyStatus = (flags: number) => {
  return {
    funded: (flags & 1) !== 0, // bit 0
    checked: (flags & 2) !== 0, // bit 1
    settled: (flags & 4) !== 0, // bit 2
  };
};

