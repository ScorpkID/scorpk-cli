import { ToolDef } from '../agent/types';
import {
  readFileTool,
  makeReadFileHandler,
  listDirTool,
  makeListDirHandler,
  writeFileTool,
  makeWriteFileHandler,
  editFileTool,
  makeEditFileHandler,
  deleteFileTool,
  makeDeleteFileHandler,
  moveFileTool,
  makeMoveFileHandler,
  computeFileChange,
  FileChange,
} from './fileTools';
import { runTerminalCommandTool, makeRunTerminalCommandHandler } from './terminalTools';
import {
  gitStatusTool,
  makeGitStatusHandler,
  gitDiffTool,
  makeGitDiffHandler,
  gitAddTool,
  makeGitAddHandler,
  gitCommitTool,
  makeGitCommitHandler,
} from './gitTools';
import { searchFilesTool, makeSearchFilesHandler } from './searchTools';
import { fetchUrlTool, fetchUrlHandler } from './webTools';
import { askUserTool, ASK_USER_TOOL_NAME } from './askUserTool';

export type ToolHandler = (args: Record<string, unknown>) => Promise<string>;

export { ASK_USER_TOOL_NAME, computeFileChange, FileChange };

export const allTools: ToolDef[] = [
  readFileTool,
  listDirTool,
  writeFileTool,
  editFileTool,
  deleteFileTool,
  moveFileTool,
  searchFilesTool,
  fetchUrlTool,
  runTerminalCommandTool,
  gitStatusTool,
  gitDiffTool,
  gitAddTool,
  gitCommitTool,
  askUserTool,
];

/** Todas las tools atan sus handlers al directorio de trabajo de esta corrida. */
export function createToolHandlers(cwd: string): Record<string, ToolHandler> {
  return {
    read_file: makeReadFileHandler(cwd),
    list_dir: makeListDirHandler(cwd),
    write_file: makeWriteFileHandler(cwd),
    edit_file: makeEditFileHandler(cwd),
    delete_file: makeDeleteFileHandler(cwd),
    move_file: makeMoveFileHandler(cwd),
    search_files: makeSearchFilesHandler(cwd),
    fetch_url: fetchUrlHandler,
    run_terminal_command: makeRunTerminalCommandHandler(cwd),
    git_status: makeGitStatusHandler(cwd),
    git_diff: makeGitDiffHandler(cwd),
    git_add: makeGitAddHandler(cwd),
    git_commit: makeGitCommitHandler(cwd),
  };
}
