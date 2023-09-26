import nock from 'nock';
import fs from 'fs/promises';
import { test, expect, beforeEach, beforeAll } from '@jest/globals';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import prettier from 'prettier';
import { getFileName, getFilesDirName } from '../src/tools.js';
import pageLoader from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testingURL = 'https://ru.hexlet.io/courses';
const filesDirName = getFilesDirName(getFileName(new URL(testingURL)));

const getFixturePath = (filename) => join(__dirname, '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFile(getFixturePath(filename), 'utf-8');

nock.disableNetConnect();

let tmpDir;
let beforeHTML;
let afterHtml;
let expectedImage;
let expectedCss;
let expectedScript;

beforeAll(async () => {
  beforeHTML = await readFixture('before_ru-hexlet-io.html');
  afterHtml = await readFixture('after_ru-hexlet-io.html');
  expectedImage = await readFixture('image.png');
  expectedCss = await readFixture('application.css');
  expectedScript = await readFixture('script.js');
});

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(join(tmpdir(), 'page-loader-'));

  nock('https://ru.hexlet.io').get('/courses').reply(200, beforeHTML);
  nock('https://ru.hexlet.io').get('/assets/professions/nodejs.png').reply(200, expectedImage);
  nock('https://ru.hexlet.io').get('/courses').reply(200, beforeHTML);
  nock('https://ru.hexlet.io').get('/assets/application.css').reply(200, expectedCss);
  nock('https://ru.hexlet.io').get('/packs/js/runtime.js').reply(200, expectedScript);
});

test('1) Should return right file name "ru-hexlet-io-courses.html"', async () => {
  await pageLoader(testingURL, tmpDir);

  const fileNamesArray = await fs.readdir(tmpDir);
  const htmlFileName = fileNamesArray[0];

  expect(htmlFileName).toEqual('ru-hexlet-io-courses.html');
});

test('2) Should load page and change links', async () => {
  await pageLoader(testingURL, tmpDir);

  const page = await fs.readFile(join(tmpDir, 'ru-hexlet-io-courses.html'), 'utf-8');

  const formatedPage = prettier.format(page, { parser: 'html', printWidth: Infinity });
  const formatedAfterHtml = prettier.format(afterHtml, { parser: 'html', printWidth: Infinity });

  expect(formatedPage).toEqual(formatedAfterHtml);
});

test('3) Should create dir: "ru-hexlet-io-courses_files"', async () => {
  await pageLoader(testingURL, tmpDir);

  const fullDirPath = join(tmpDir, filesDirName);
  const stats = await fs.stat(fullDirPath);
  const fileNamesArray = await fs.readdir(tmpDir);
  const directoryName = fileNamesArray[1];

  expect(stats.isDirectory()).toBe(true);
  expect(directoryName).toEqual(filesDirName);
});

test('4) Should load img', async () => {
  await pageLoader(testingURL, tmpDir);
  const img = await fs.readFile(join(tmpDir, filesDirName, 'ru-hexlet-io-assets-professions-nodejs.png'), 'utf-8');

  expect(img).toEqual(expectedImage);
});

test('5) Should load css', async () => {
  await pageLoader(testingURL, tmpDir);
  const css = await fs.readFile(join(tmpDir, filesDirName, 'ru-hexlet-io-assets-application.css'), 'utf-8');

  expect(css).toEqual(expectedCss);
});

test('6) Should load script', async () => {
  await pageLoader(testingURL, tmpDir);
  const script = await fs.readFile(join(tmpDir, filesDirName, 'ru-hexlet-io-packs-js-runtime.js'), 'utf-8');

  expect(script).toEqual(expectedScript);
});

// test('7) Err: Directory is not exist', async () => {
//   const notExistedDir = join(tmpdir(), '/not_existed_dir');

//   await expect(pageLoader(testingURL, notExistedDir)).rejects.toThrow('ENOENT');
// });

test('8) Err: Access error', async () => {
  await expect(pageLoader(testingURL, '/sys')).rejects.toThrow('EACCES');
});

test('9) Err: 404', async () => {
  nock('https://hexlet.ru').get('/not_found_page').reply(404);
  await expect(pageLoader('https://hexlet.ru/not_found_page', tmpDir)).rejects.toThrow('Request failed with status code 404');
});
