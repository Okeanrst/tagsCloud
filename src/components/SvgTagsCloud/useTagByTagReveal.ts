import { useCallback, useEffect, useState } from 'react';

export function useTagByTagReveal(tagsCount: number, tagByTagRenderInterval: number) {
  const [tagEndIndexToShow, setTagEndIndexToShow] = useState(-1);

  useEffect(() => {
    if (!tagsCount || tagEndIndexToShow === -1) {
      return;
    }
    if (tagEndIndexToShow >= tagsCount) {
      queueMicrotask(() => {
        setTagEndIndexToShow(-1);
      });
      return;
    }
    const timeout = setTimeout(() => {
      setTagEndIndexToShow((v) => v + 1);
    }, tagByTagRenderInterval * 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [tagsCount, tagEndIndexToShow, tagByTagRenderInterval]);

  const beginTagByTagReveal = useCallback(() => {
    setTagEndIndexToShow(1);
  }, []);

  return { tagEndIndexToShow, beginTagByTagReveal };
}
