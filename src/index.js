import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';
import {
  getFileName,
  extractImageUrls,
  getImagePaths,
  replaceUrls,
  writeFile,
  downloadImages,
} from './tools';

const loadHtmlPage = async (url, output) => {
  const fileName = getFileName(new URL(url));
  const filesDirName = `${fileName}_files`;
  const htmlPath = path.join(output, `${fileName}.html`);
  const filesPath = path.join(output, filesDirName);

  try {
    const page = await axios.get(url);
    const imageUrls = extractImageUrls(page.data);
    const absoluteImagePaths = getImagePaths(imageUrls, filesPath);
    const relativeImagePaths = getImagePaths(imageUrls, filesDirName);
    const htmlWithReplacedImageUrls = replaceUrls(page.data, relativeImagePaths);
    await writeFile(htmlPath, htmlWithReplacedImageUrls);
    await downloadImages(imageUrls, absoluteImagePaths);
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
