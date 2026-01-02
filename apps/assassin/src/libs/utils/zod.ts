import * as z from "zod";

/**
 * BigInt를 number로 자동 변환하는 Zod 스키마
 * Prisma에서 BigInt 타입으로 받은 값을 number로 변환할 때 사용
 *
 * @example
 * const schema = z.object({
 *   sortOrder: bigIntToNumber,
 * });
 */
export const bigIntToNumber = z.union([z.number(), z.bigint()]).transform((val) => Number(val));
