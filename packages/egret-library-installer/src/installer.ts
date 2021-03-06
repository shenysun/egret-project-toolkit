import axios from 'axios';
import * as fs from 'fs-extra-promise';
import * as path from 'path';
import { Unzip } from 'zip-lib';
import { getAppDataPath } from './utils';
const progress = require('request-progress');
const request = require('request');

type EngineList = { version: string, date: string, url: string, type: number }[];

export async function downloadAndInstall(version: string) {
    await downloadEngine(version);
    await extractEngine(version);
}

export async function downloadEngine(version: string) {
    const data = await fetch();
    const engineData = data.find(item => item.version === version);
    if (engineData) {
        const root = getAppDataPath();
        const zipFilePath = path.join(root, 'lib', `egret-core-${version}.zip`)
        await downloadFile(engineData.url, zipFilePath);
    }
    else {
        throw new Error(version);
    }
}

export async function extractEngine(version: string) {
    const root = getAppDataPath();
    const zipFilePath = path.join(root, 'lib/', `egret-core-${version}.zip`)
    const extractTempDirPath = path.join(root, 'temp');
    const targetPath = path.join(root, 'engine', version);

    await clearDirectory(extractTempDirPath)
    await clearDirectory(targetPath);
    await extractZipFile(zipFilePath, extractTempDirPath);
    await fs.ensureDirAsync(targetPath);
    await fs.copyAsync(path.join(extractTempDirPath, `egret-core-${version}`), targetPath);
    await clearDirectory(extractTempDirPath)
}

async function clearDirectory(directory: string) {
    const existed = await fs.existsAsync(directory)
    if (existed) {
        // await fs.removeAsync(directory); ??
    }
}

async function downloadFile(url: string, dist: string) {
    await fs.ensureDirAsync(path.dirname(dist));
    return new Promise((resolve, reject) => {
        progress(request(url))
            .on('progress', (state: any) => {
                console.log('progress', state.size.transferred);
            })
            .on('error', (err: any) => {
                reject(err);
            })
            .pipe(fs.createWriteStream(dist))
            .on('finish', () => resolve());
    });
}


async function fetch() {
    const response = await axios.get('http://tool.egret-labs.org/EgretCore/enginelist.json', { responseType: "json" });
    const data = response.data.engine as EngineList;
    return data;
}

async function extractZipFile(zipPath: string, target: string): Promise<void> {
    await fs.ensureDirAsync(target);
    const unzip = new Unzip();
    return unzip.extract(zipPath, target);
}

