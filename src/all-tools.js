import { tool } from "@langchain/core/tools";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { z } from "zod";

export const readfileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    return `文件内容:\n${content}`;
  },
  {
    name: "read_file",
    description:
      "用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

export const writerFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, "utf8");
      console.log(
        `  [工具调用] write_file("${filePath}") - 成功写入 ${content.length} 字节`,
      );
      return `文件写入成功:${filePath}`;
    } catch (error) {
      return `文件写入失败${error.messages}`;
    }
  },
  {
    name: "write_file",
    description: "向指定路路径写入文件内容,自动创建目录",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
      content: z.string().describe("要写入的文件路径"),
    }),
  },
);

export const executeCommandTool = tool(
  async ({ command, workingDirectory }) => {
    try {
      const cwd = workingDirectory || process.cwd();

      console.log(
        `  [工具调用] execute_command("${command}")${workingDirectory ? ` - 工作目录: ${workingDirectory}` : ""}`,
      );
      return new Promise((resolve, reject) => {
        const [cmd, ...args] = command.split(" ");

        const child = spawn(cmd, args, {
          cwd,
          stdio: "inherit",
          shell: true,
        });
        let errorMsg = "";

        child.on("error", (error) => {
          errorMsg = error.message;
        });

        child.on("close", (code) => {
          if (code === 0) {
            console.log(
              `  [工具调用] execute_command("${command}") - 执行成功`,
            );
            const cwdInfo = workingDirectory
              ? `\n\n重要提示：命令在目录 "${workingDirectory}" 中执行成功。如果需要在这个项目目录中继续执行命令，请使用 workingDirectory: "${workingDirectory}" 参数，不要使用 cd 命令。`
              : "";
            resolve(`命令执行成功: ${command}${cwdInfo}`);
          } else {
            console.log(
              `  [工具调用] execute_command("${command}") - 执行失败，退出码: ${code}`,
            );
            resolve(
              `命令执行失败，退出码: ${code}${errorMsg ? "\n错误: " + errorMsg : ""}`,
            );
          }
        });
      });
    } catch (error) {
      return `文件写入失败${error.messages}`;
    }
  },
  {
    name: "execute_command",
    description: "执行系统命令，支持指定工作目录，实时显示输出",
    schema: z.object({
      command: z.string().describe("要执行的命令"),
      workingDirectory: z.string().optional().describe("工作目录（推荐指定）"),
    }),
  },
);

export const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    const files = await fs.readdir(directoryPath);
    console.log(
      `  [工具调用] list_directory("${directoryPath}") - 找到 ${files.length} 个项目`,
    );
    return `目录内容:\n${files}`;
  },
  {
    name: "list_directory",
    description: "列出指定目录下的所有文件和文件夹",
    schema: z.object({
      directoryPath: z.string().describe("目录路径"),
    }),
  },
);
