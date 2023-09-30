import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fsp from 'fs/promises';
import nock from 'nock';
import {
  test,
  expect,
  beforeAll,
  beforeEach,
} from '@jest/globals';
import prettier from 'prettier';
import pageLoader from '../src/index.js';
import { getFileName } from '../src/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const origin = 'https://ru.hexlet.io';
const testURL = `${origin}/courses`;
const testDirPath = getFileName(testURL).replace('.html', '_files');

const getFixturePath = (filename) => join(__dirname, '..', '__fixtures__', filename);
const readFixture = (filename) => fsp.readFile(getFixturePath(filename), 'utf-8');

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
  tmpDir = await fsp.mkdtemp(join(tmpdir(), 'page-loader-'));

  nock(origin).get('/courses').reply(200, beforeHTML);
  nock(origin).get('/assets/professions/nodejs.png').reply(200, expectedImage);
  nock(origin).get('/assets/application.css').reply(200, expectedCss);
  nock(origin).get('/packs/js/runtime.js').reply(200, expectedScript);
});

test('1) Should return right file name "ru-hexlet-io-courses.html"', async () => {
  await pageLoader(testURL, tmpDir);

  const fileNamesArray = await fsp.readdir(tmpDir);
  const htmlFileName = fileNamesArray[0];

  expect(htmlFileName).toEqual('ru-hexlet-io-courses.html');
});

test('2) Should load page and change links', async () => {
  await pageLoader(testURL, tmpDir);

  const page = await fsp.readFile(join(tmpDir, 'ru-hexlet-io-courses.html'), 'utf-8');
  const formatedPage = prettier.format(page, { parser: 'html', printWidth: Infinity });
  const formatedAfterHtml = prettier.format(afterHtml, { parser: 'html', printWidth: Infinity });
  expect(formatedPage).toEqual(formatedAfterHtml);
});

test('3) Should create dir: "ru-hexlet-io-courses_files"', async () => {
  await pageLoader(testURL, tmpDir);

  const fullDirPath = join(tmpDir, testDirPath);
  const stats = await fsp.stat(fullDirPath);
  const fileNamesArray = await fsp.readdir(tmpDir);
  const directoryName = fileNamesArray[1];
  expect(stats.isDirectory()).toBe(true);
  expect(directoryName).toEqual(testDirPath);
});

test('4) Should load img', async () => {
  await pageLoader(testURL, tmpDir);

  const img = await fsp.readFile(join(tmpDir, testDirPath, 'ru-hexlet-io-assets-professions-nodejs.png'), 'utf-8');
  expect(img).toEqual(expectedImage);
});

test('5) Should load css', async () => {
  await pageLoader(testURL, tmpDir);

  const css = await fsp.readFile(join(tmpDir, testDirPath, 'ru-hexlet-io-assets-application.css'), 'utf-8');
  expect(css).toEqual(expectedCss);
});

test('6) Should load script', async () => {
  await pageLoader(testURL, tmpDir);

  const script = await fsp.readFile(join(tmpDir, testDirPath, 'ru-hexlet-io-packs-js-runtime.js'), 'utf-8');
  expect(script).toEqual(expectedScript);
});

test('7) Err: Access error', async () => {
  await expect(pageLoader(testURL, '/sys')).rejects.toThrow('EACCES');
});

test('8) Err: 404', async () => {
  nock('https://hexlet.ru').get('/not_found_page').reply(404);
  await expect(pageLoader('https://hexlet.ru/not_found_page', tmpDir)).rejects.toThrow('Request failed with status code 404');
});
