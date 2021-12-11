import { IdGlyphsMapT, PreparedTagDataT } from '../types/types';
import { getGlyphsMap } from './getGlyphsMap';
import { splitAndPerformWork } from './common/splitAndPerformWork';

export function prepareDataGlyphsMap(
  tagsData: ReadonlyArray<PreparedTagDataT>,
  minFontSize = 30,
): Promise<ReadonlyArray<IdGlyphsMapT>> {
  return new Promise(function (resolve, reject) {
    const canvas = document.createElement('canvas');

    const workGenerator: () => Generator<IdGlyphsMapT> =
      function* workGenerator() {
        for (let i = 0; i < tagsData.length; i++) {
          const item = tagsData[i];
          const biggestFontSize =
            minFontSize < item.fontSize ? item.fontSize : minFontSize;
          const map = getGlyphsMap(canvas, item.label, biggestFontSize);
          yield { id: item.id, map };
        }
      };
    splitAndPerformWork<IdGlyphsMapT>(workGenerator, 50)
      .then(resolve)
      .catch(reject);
  });
}
