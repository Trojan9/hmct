/** Page numbers to show: first, last, and the current page with its neighbours. */
export const pageItems = (page: number, totalPages: number): (number | 'ellipsis')[] => {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return pages.flatMap((p, index) =>
    index > 0 && p - pages[index - 1] > 1 ? ['ellipsis' as const, p] : [p],
  );
};
