export enum SortOptions {
  Name = "name",
  Latest = "-datetime_created",
  Popular = "-aggregated_fields__package_count",
  MostDownloads = "-aggregated_fields__download_count",
}

export const getSortOptionLabel = (option: SortOptions): string => {
  switch (option) {
    case SortOptions.Name:
      return "Name";
    case SortOptions.Latest:
      return "Latest";
    case SortOptions.Popular:
      return "Popular";
    case SortOptions.MostDownloads:
      return "Most Downloads";
    default:
      return "Unknown";
  }
};
