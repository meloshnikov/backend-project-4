import path from 'path';
import fsp from 'fs/promises';
import axios from 'axios';
import { load } from 'cheerio';
import Listr from 'listr';

const attrMapper = [
  { tag: 'img', attribute: 'src' },
  { tag: 'link', attribute: 'href' },
  { tag: 'script', attribute: 'src' },
];

export const getFileName = (url, origin) => {
  const { hostname, pathname } = new URL(url, origin);

  const extension = path.extname(pathname);
  const pathName = extension ? pathname.split(extension)[0] : pathname;

  const newName = pathName === '/' ? `${hostname}`.replace(/[^a-z0-9]/gm, '-') : `${hostname}${pathName}`.replace(/[^a-z0-9]/gm, '-');
  return extension ? `${newName}${extension}` : `${newName}.html`;
};

export const downloadResources = (html, dirPath, dirN, fullPath, originUrl) => {
  const $ = load(html);
  const promises = [];

  attrMapper.forEach(({ tag, attribute }) => $(tag).each((_index, el) => {
    const elem = $(el).attr(attribute);

    const { href, origin } = new URL(elem, originUrl);

    if (origin === originUrl && elem !== undefined) {
      const newName = getFileName(elem, originUrl);

      const promise = axios.get(href, { responseType: 'arraybuffer' })
        .then((response) => fsp.writeFile(path.join(dirPath, newName), response.data))
        .then(() => {
          $(el).attr(attribute, path.join(dirN, newName));
          const newFile = $.html();
          return fsp.writeFile(fullPath, newFile);
        });
      promises.push({ title: newName, task: () => promise });
    }

    return null;
  }));

  const tasks = new Listr(promises, { concurrent: true, exitOnError: true });

  return tasks.run();
};
