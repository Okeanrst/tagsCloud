import { IdRectAreaMapT, PreparedTagDataT } from '../types/types';
import { getRectAreaMap } from './getGlyphsMap';
import { splitAndPerformWork } from './common/splitAndPerformWork';

export function prepareRectAreasMaps(
  tagsData: ReadonlyArray<PreparedTagDataT>,
  resolution: number,
): Promise<ReadonlyArray<IdRectAreaMapT>> {
  return new Promise(function (resolve, reject) {
    const canvas = document.createElement('canvas');

    const workGenerator: () => Generator<IdRectAreaMapT> =
      function* workGenerator() {
        for (let i = 0; i < tagsData.length; i++) {
          const { id, label, fontSize } = tagsData[i];
          const { map = null, meta = null } =
            getRectAreaMap(canvas, {
              word: label,
              resolution,
              fontSize,
            }) ?? {};
          yield { id, map, mapMeta: meta };
        }
      };

    splitAndPerformWork<IdRectAreaMapT>(workGenerator, 50)
      .then(resolve)
      .catch(reject);
  });
}
