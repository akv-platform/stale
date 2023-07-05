import {IStateStorage} from '../../interfaces/state/state-storage';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as core from '@actions/core';
import {downloadFileFromActionsCache} from '../actions-cache-hilevel/download';
import {uploadFileToActionsCache} from '../actions-cache-hilevel/upload';
import * as exec from '@actions/exec';
/*
import {uploadFileToActionsCache} from '../actions-cache-internal/upload';
import {downloadFileFromActionsCache} from '../actions-cache-internal/download';
 */

const CACHE_KEY = '_state';
const CACHE_VERSION = '1';
const STATE_FILE = 'state.txt';
const STALE_DIR = '56acbeaa-1fef-4c79-8f84-7565e560fb03';

const mkTempDir = (): string => {
  const tmpDir = path.join(os.tmpdir(), STALE_DIR);
  fs.mkdirSync(tmpDir, {recursive: true});
  return tmpDir;
};

const unlinkSafely = (filePath: string) => {
  try {
    fs.unlinkSync(filePath);
  } catch (foo) {
    /* ignore */
  }
};

export const getCommandOutput = async (
  toolCommand: string,
  cwd?: string
): Promise<string> => {
  let {stdout, stderr, exitCode} = await exec.getExecOutput(
    toolCommand,
    undefined,
    {ignoreReturnCode: true, ...(cwd && {cwd})}
  );

  if (exitCode) {
    stderr = !stderr.trim()
      ? `The '${toolCommand}' command failed with exit code: ${exitCode}`
      : stderr;
    throw new Error(stderr);
  }

  return stdout.trim();
};
async function execCommands(commands: string[], cwd?: string): Promise<void> {
  for (const command of commands) {
    try {
      await exec.exec(command, undefined, {cwd});
    } catch (error) {
      throw new Error(
        `${command.split(' ')[0]} failed with error: ${error?.message}`
      );
    }
  }
}
export class StateCacheStorage implements IStateStorage {
  async save(serializedState: string): Promise<void> {
    const tmpDir = mkTempDir();
    const fileName = path.join(tmpDir, STATE_FILE);
    fs.writeFileSync(fileName, serializedState);

    try {
      core.debug(tmpDir);
      core.debug(path.dirname(fileName));
      core.debug(fileName);
      core.debug(serializedState);
      core.debug('1 ' + fs.readFileSync(fileName).toString());
      await execCommands(['ls -la'], tmpDir);
      fs.readdir(path.dirname(fileName), (err, files) => {
        files.forEach(file => {
          core.debug(file);
        });
      });
      await uploadFileToActionsCache(fileName, CACHE_KEY, CACHE_VERSION);
      await execCommands(
        [
          'pwd',
          'ls -la',
          'find /home/runner/work/ -name cache.tzst',
          'find /home/runner/work/ -name manifest.txt'
        ],
        tmpDir
      );
      const tar = await getCommandOutput(
        'find /home/runner/work/ -name cache.tzst'
      );
      await execCommands([`tar -tvf ${tar} --use-compress-program zstdmt`]);
      const manifest = await getCommandOutput(
        'find /home/runner/work/ -name manifest.txt'
      );
      await execCommands([`cat ${manifest}`]);
    } catch (error) {
      core.warning(
        `Saving the state was not successful due to "${
          error.message || 'unknown reason'
        }"`
      );
    } finally {
      unlinkSafely(fileName);
    }
  }

  async restore(): Promise<string> {
    const tmpDir = mkTempDir(); //fs.mkdtempSync('state-');
    const fileName = path.join(tmpDir, STATE_FILE);
    unlinkSafely(fileName);
    try {
      await downloadFileFromActionsCache(fileName, CACHE_KEY, CACHE_VERSION);

      await execCommands([`ls -la ${path.dirname(fileName)}`]);

      if (!fs.existsSync(fileName)) {
        core.info(
          'The stored state has not been found, probably because of the very first run or the previous run failed'
        );
        return '';
      }
      return fs.readFileSync(path.join(tmpDir, STATE_FILE), {
        encoding: 'utf8'
      });
    } catch (error) {
      core.warning(
        `Restoring the state was not successful due to "${
          error.message || 'unknown reason'
        }"`
      );
      return '';
    }
  }
}
