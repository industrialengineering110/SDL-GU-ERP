import type { SewingCosting, SystemConfig } from '../types';
import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value == 'object' && !Array.isArray(value);
};

const deepMerge = <T>(baseValue: T, incomingValue: unknown): T => {
  if (incomingValue === undefined || incomingValue === null) {
    return baseValue;
  }

  if (Array.isArray(baseValue)) {
    return (Array.isArray(incomingValue) ? incomingValue : baseValue) as T;
  }

  if (isPlainObject(baseValue)) {
    if (!isPlainObject(incomingValue)) {
      return baseValue;
    }

    const merged: Record<string, unknown> = { ...baseValue };
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(incomingValue)]);

    keys.forEach((key) => {
      merged[key] = deepMerge((baseValue as Record<string, unknown>)[key], incomingValue[key]);
    });

    return merged as T;
  }

  return incomingValue as T;
};

export const mergeSystemConfig = (incomingConfig: Partial<SystemConfig> | null | undefined): SystemConfig => {
  return deepMerge(DEFAULT_SYSTEM_CONFIG, incomingConfig ?? {});
};

export const getDefaultSewingCosting = (): SewingCosting => ({
  id: '',
  buyer: '',
  styleNumber: '',
  styleCode: '',
  productCategory: '',
  size: '',
  fabrication: '',
  numStyling: 1,
  numStyle: 1,
  numColor: 1,
  marketingOrderQty: 0,
  lineConsideration: 1,
  operations: [],
  dailyTargets: [
    { day: 1, target: 0 },
    { day: 2, target: 0 },
    { day: 3, target: 0 },
    { day: 4, target: 0 }
  ],
  topTargetDay: 4,
  createdAt: '',
  updatedAt: '',
  user: ''
});

export const normalizeSewingCosting = (record: Partial<SewingCosting> | null | undefined): SewingCosting => {
  const defaults = getDefaultSewingCosting();
  const safeRecord = record ?? {};

  return {
    ...defaults,
    ...safeRecord,
    buyer: safeRecord.buyer ?? defaults.buyer,
    styleNumber: safeRecord.styleNumber ?? defaults.styleNumber,
    styleCode: safeRecord.styleCode ?? defaults.styleCode,
    productCategory: safeRecord.productCategory ?? defaults.productCategory,
    size: safeRecord.size ?? defaults.size,
    fabrication: safeRecord.fabrication ?? defaults.fabrication,
    numStyling: safeRecord.numStyling ?? defaults.numStyling,
    numStyle: safeRecord.numStyle ?? defaults.numStyle,
    numColor: safeRecord.numColor ?? defaults.numColor,
    marketingOrderQty: safeRecord.marketingOrderQty ?? defaults.marketingOrderQty,
    lineConsideration: safeRecord.lineConsideration ?? defaults.lineConsideration,
    operations: Array.isArray(safeRecord.operations) ? safeRecord.operations : defaults.operations,
    dailyTargets: Array.isArray(safeRecord.dailyTargets) && safeRecord.dailyTargets.length > 0 ? safeRecord.dailyTargets : defaults.dailyTargets,
    history: Array.isArray(safeRecord.history) ? safeRecord.history : [],
    createdAt: safeRecord.createdAt ?? defaults.createdAt,
    updatedAt: safeRecord.updatedAt ?? defaults.updatedAt,
    user: safeRecord.user ?? defaults.user
  };
};
