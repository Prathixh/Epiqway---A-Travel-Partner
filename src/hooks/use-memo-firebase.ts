
'use client';
import { useMemo } from 'react';
import {
  Query,
  DocumentReference,
  queryEqual,
  refEqual,
} from 'firebase/firestore';

type Memoizable = Query | DocumentReference | null | undefined;

let PREV_REF: Record<string, Memoizable> = {};

export function useMemoFirebase<T extends Memoizable>(
  getRef: () => T,
  deps: any[]
): T {
  const anemicMemo = useMemo(getRef, deps);

  return useMemo(() => {
    if (!anemicMemo) {
      return anemicMemo;
    }

    const cacheKey =
      anemicMemo.type === 'query' ? anemicMemo.path : anemicMemo.id;
    const prev = PREV_REF[cacheKey];

    if (!prev) {
      PREV_REF[cacheKey] = anemicMemo;
      return anemicMemo;
    }

    if (
      anemicMemo.type === 'query' &&
      prev.type === 'query' &&
      queryEqual(anemicMemo, prev)
    ) {
      return prev as T;
    }

    if (
      anemicMemo.type === 'document' &&
      prev.type === 'document' &&
      refEqual(anemicMemo, prev)
    ) {
      return prev as T;
    }

    PREV_REF[cacheKey] = anemicMemo;
    return anemicMemo;
  }, [anemicMemo]);
}
