"use client";

import { useState } from "react";

export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = (totalPages: number) => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const goToPage = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
  };
}
