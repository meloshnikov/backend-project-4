import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { readFileSync } from 'fs';
import { test, expect } from '@jest/globals';
import downloadPage from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fileNames = ['ru-hexlet-io-courses.html'];

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

const stylish = readFileSync(getFixturePath('stylish'), { encoding: 'utf8', flag: 'r' });
const plain = readFileSync(getFixturePath('plain'), { encoding: 'utf8', flag: 'r' });
const json = readFileSync(getFixturePath('json'), { encoding: 'utf8', flag: 'r' });

const output = { stylish, plain, json };

// const testArgs = formatters.flatMap((format) => (
//   fileExtensions.map((fileExtension) => [fileExtension, format])
// ));

test.each(fileNames)('%s type files difference with %s output', (fileName) => {
  const before = getFixturePath(`before.${fileName}`);
  const after = getFixturePath(`after.${fileName}`);
  expect(downloadPage(before, after)).toEqual(output);
});
