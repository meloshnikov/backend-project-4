import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
// import { load } from 'cheerio';
import axios from 'axios';

const getFileName = ({ host, pathname }) => (host + pathname).replace(/[^\d+\w]/g, '-');

const loadHtmlPage = async (dirName, url, fileName) => {
  const response = await axios.get(url);
  await writeFile(fileName, response.data);
};

const downloadPage = async (url, output = process.cwd()) => {
  const fileName = getFileName(new URL(url));
  const filePath = path.join(output, `${fileName}.html`);

  return mkdir(output, { recursive: true })
    .then(() => loadHtmlPage(output, url, filePath))
    .then(() => console.log('Ok'))
    .catch((e) => { throw new Error(e); });
};

export default downloadPage;
