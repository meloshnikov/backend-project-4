import path from 'path';
import fs from 'fs/promises';
import { load } from 'cheerio';
import axios from 'axios';

const attrMapper = {
  img: 'src',
  link: 'href',
  script: 'src',
};

export const getFileName = ({ host, pathname }) => (host + pathname).replace(/[^\d+\w]/g, '-');

export const getAssetName = (url) => (url ? url.split('/').pop() : undefined);

export const isFile = (url) => !!getAssetName(url).split('.')[1] ?? false;

export const getAssetPaths = (urls, output) => urls.map((url) => {
  const assetName = getAssetName(url);
  return path.join(output, assetName);
});

export const getPaths = (urls, relativePath, absolutePath) => ({
  relative: getAssetPaths(urls, relativePath),
  absolute: getAssetPaths(urls, absolutePath),
});

export const replaceUrls = (html, tag, replacementPaths) => {
  const $ = load(html);
  const assets = Array.from($(tag));
  replacementPaths.forEach((replacePath) => {
    const assetName = getAssetName(replacePath);
    const elements = assets.filter((el) => getAssetName($(el).attr(attrMapper[tag])) === assetName);
    elements.forEach((element) => $(element).attr(attrMapper[tag], replacePath));
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

export const downloadAssets = async (urls, absolutePaths) => {
  await Promise.allSettled(urls.map((url, index) => downloadFile(url, absolutePaths[index])));
};

export const extractUrlsByTag = (html, origin, tag) => {
  const $ = load(html);
  const assets = $(tag);
  return Array.from(assets)
    .map((el) => $(el).attr(attrMapper[tag]))
    .filter((url) => String(url).startsWith('/') || (String(url).includes(origin) && isFile(url)))
    .map((pathname) => (new URL(pathname, origin)).toString());
};
