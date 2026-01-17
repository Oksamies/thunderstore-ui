// Table ROOT
// Variants
export const TableVariantsList = ["default", "packages"] as const;
export type TableVariants = "default" | "packages";

// Sizes
export const TableSizesList = ["medium"] as const;
export type TableSizes = "medium";

// Modifiers
export const TableModifiersList = ["alignLastColumnRight"] as const;
// There is an issue with Typescript (eslint) and prettier disagreeing if
// the type should have parentheses
// prettier-ignore
export type TableModifiers = typeof TableModifiersList[number];
