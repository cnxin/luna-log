export type SearchableTimelineItem = {
  title: string;
  meta: readonly string[];
  notes?: string;
  searchText?: readonly string[];
};

export function filterTimelineBySearch<T extends SearchableTimelineItem>(items: T[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const haystack = [item.title, ...item.meta, item.notes || '', ...(item.searchText || [])]
      .join(' ')
      .toLocaleLowerCase();
    return haystack.includes(normalizedQuery);
  });
}
