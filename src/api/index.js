/**
 * Mocking client-server processing
 */

// @flow
import data from './data.json';

const TIMEOUT = 0;

function getData():Promise {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(data), TIMEOUT);
  });
}

export default {getData};