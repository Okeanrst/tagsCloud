'use strict';

const data = require('./data.json');
const calculatePositions = require('..');
const { pickingStrategies } = require('..');

const {ASC, DESC} = pickingStrategies;

const bestOptions = {
  pickingClosedVacancyStrategy: DESC,
  pickingEdgeVacancyStrategy: ASC,
  addIfEmptyIndex: 5,
};

const options = {
  drawFinishMap: true,
  drawStepMap: false,
  drawVacanciesMap: false,
  pickingClosedVacancyStrategy: DESC,
  pickingEdgeVacancyStrategy: ASC,
  addIfEmptyIndex: 5,
};

const result = calculatePositions(data, options);

