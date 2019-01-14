'use strict';

/**
 * Mocking client-server processing
 */
import data from './data.json';

const TIMEOUT = 0;

function getData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(data), TIMEOUT);
  });
}

export default {getData};