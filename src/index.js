import 'axios-debug-log';
import fsp from 'fs/promises';
import path from 'path';
import axios from 'axios';
import debug from 'debug';
import { getFileName, downloadResources } from './tools.js';

const logger = debug('page-loader');

const pageLoader = async (url, output = process.cwd()) => {
  logger(`URL: ${url}`);
  logger(`Download directory: ${output}`);

  const { origin } = new URL(url);

  const nameHtml = getFileName(url, origin);
  const fullHtmlPath = path.join(output, nameHtml);

  const dirName = getFileName(url, origin).replace('.html', '_files');
  const fullDirPath = path.join(output, dirName);

  return axios.get(url, { responseType: 'arraybuffer' })
    .then((response) => {
      logger('Write downloaded data to file');
      return fsp.writeFile(fullHtmlPath, response.data);
    })
    .then(() => {
      logger('Create dir if not exist');
      return fsp.access(fullDirPath)
        .catch(() => fsp.mkdir(fullDirPath));
    })
    .then(() => {
      logger('Read downloaded file');
      return fsp.readFile(fullHtmlPath, 'utf-8');
    })
    .then((file) => {
      logger('Download resources');
      return downloadResources(file, fullDirPath, dirName, fullHtmlPath, origin);
    });
};

export default pageLoader;
