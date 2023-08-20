import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import {
  getFileName,
  extractUrlsByTag,
  getPaths,
  replaceUrls,
  writeFile,
  downloadAssets,
} from './tools.js';

const loadHtmlPage = async (url, output) => {
  const { host, pathname, origin } = new URL(url);
  const fileName = getFileName({ host, pathname });
  const filesDirName = `${fileName}_files`;
  const htmlPath = path.join(output, `${fileName}.html`);
  const filesPath = path.join(output, filesDirName);

  const downloadedResources = ['img', 'link', 'script'];

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
    console.error(`Failed to download the page: ${error.message}`);
    throw error;
  }
};

const downloadPage = async (url, output = process.cwd()) => fs.mkdir(output, { recursive: true })
  .then(() => loadHtmlPage(url, output))
  .then(() => console.log('Ok'))
  .catch((e) => { throw new Error(e); });

export default downloadPage;
