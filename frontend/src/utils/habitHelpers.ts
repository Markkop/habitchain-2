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

/**
 * Format PAS rewards: if >= 1k, show as "1.1k" format without .00 decimals
 * Otherwise show with 2 decimal places
 */
export const formatRewards = (value: number): string => {
  if (value >= 1000) {
    const thousands = value / 1000;
    // Round to 1 decimal place
    const rounded = Math.round(thousands * 10) / 10;
    // Remove trailing .0 if present
    return rounded % 1 === 0 ? `${Math.round(rounded)}k` : `${rounded}k`;
  }
  // For values < 1k, show with 2 decimals
  return value.toFixed(2);
};

