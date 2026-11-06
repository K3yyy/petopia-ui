export const asArray = (value) =>
  Array.isArray(value) ? value : value ? [value] : [];
export const titleCase = (value = "") =>
  value.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
