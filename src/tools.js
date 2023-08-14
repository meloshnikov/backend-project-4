import path from 'path';
import fs from 'fs/promises';
import { load } from 'cheerio';
import axios from 'axios';

export const getFileName = ({ host, pathname }) => (host + pathname).replace(/[^\d+\w]/g, '-');

export const getImageName = (imageURL) => imageURL.split('/').pop();

export const getImagePaths = (urls, output) => urls.map((url) => {
  const imageName = getImageName(url);
  return path.join(output, imageName);
});

export const replaceUrls = (html, replacementUrls) => {
  const $ = load(html);
  $('img').each((index, el) => {
    $(el).attr('src', replacementUrls[index]);
  });
  return $.html();
};

export const writeFile = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
  return filePath;
};

export const downloadFile = async (fileUrl, filePath) => {
  const { data } = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  return writeFile(filePath, data);
};

export const downloadImages = async (urls, absolutePaths) => {
  await Promise.allSettled(urls.map((url, index) => downloadFile(url, absolutePaths[index])));
};

export const extractImageUrls = (html) => {
  const $ = load(html);
  const images = $('img');
  return Array.from(images).map((el) => {
    const src = $(el).attr('src');
    return new URL(src).toString();
  });
};
