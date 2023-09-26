import path from 'path';
import fs from 'fs/promises';
import debug from 'debug';
import axios from 'axios';
import axiosDebugger from './axiosDebugger.js';
import {
  logger,
  getFileName,
  extractUrlsByTag,
  getPaths,
  replaceUrls,
  writeFile,
  downloadAssets,
  getFilesDirName,
} from './tools.js';

const loadHtmlPage = async (url, output) => {
  const { origin } = new URL(url);
  const fileName = getFileName(url);
  const filesDirName = getFilesDirName(fileName);
  const htmlPath = path.join(output, `${fileName}.html`);
  const filesPath = path.join(output, filesDirName);

  const downloadedResources = ['img', 'link', 'script'];
  logger('Loading page', url);

  try {
    const page = await axios.get(url);
    let editedHtml = page.data;
    downloadedResources.forEach(async (tag) => {
      const urls = extractUrlsByTag(page.data, origin, tag);
      if (urls.length) {
        const paths = getPaths(urls, filesDirName, filesPath);
        editedHtml = replaceUrls(editedHtml, tag, paths.relative);
        await downloadAssets(urls, paths.absolute);
      }
    });
    await writeFile(htmlPath, editedHtml);
  } catch (error) {
    logger('Failed to download the page');
    throw error;
  }
};

const downloadPage = async (url, output = process.cwd()) => {
  if (process.env.DEBUG === 'axios') {
    axiosDebugger(axios, debug);
  }
  logger('Creating directory', output);
  return fs.mkdir(output, { recursive: true })
    .then(() => loadHtmlPage(url, output))
    .catch((e) => { throw new Error(e); });
};

export default downloadPage;
