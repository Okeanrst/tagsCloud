import { IdRectAreaMapT, PreparedTagDataT } from '../types/types';
import { getRectAreaMap } from './getGlyphsMap';
import { splitAndPerformWork } from './common/splitAndPerformWork';

export function formRectAreaMapKey(word: string, fontSize: number) {
  return `${word}_${fontSize}`;
}

export function prepareRectAreasMaps(
  tagsData: ReadonlyArray<PreparedTagDataT>,
  { resolution, fontFamily }: {resolution: number; fontFamily: string},
): Promise<ReadonlyArray<IdRectAreaMapT>> {
  return new Promise(function (resolve, reject) {
    const canvas = document.createElement('canvas');

    const rectAreasMaps = new Map<string, IdRectAreaMapT>();

    const workGenerator: () => Generator<void> =
      function* workGenerator() {
        for (let i = 0; i < tagsData.length; i++) {
          const { label, fontSize } = tagsData[i];
          const key = formRectAreaMapKey(label, fontSize);

          if (rectAreasMaps.has(key)) {
            yield;
            continue;
          }

          const { map = null, meta = null } =
            getRectAreaMap(canvas, {
              word: label,
              resolution,
              fontSize,
              fontFamily,
            }) ?? {};

          rectAreasMaps.set(key, { key , map, mapMeta: meta });

          yield;
        }
      };

    splitAndPerformWork<void>(workGenerator, 50)
      .then(() => {
        resolve([...rectAreasMaps.values()]);
      })
      .catch(reject);
  });
}
