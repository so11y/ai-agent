import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: "qwen3-coder-30b-a3b-instruct",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const readFileTool = tool((args) => readFile(args.filePath, "utf8"), {
  name: "read_file",
  description: "用于读取文件",
  schema: z.object({
    filePath: z.string().describe("用于立即读取文件内容，使用相对路径"),
  }),
});

const tools = [readFileTool];

const modelWithTools = model.bindTools(tools);

const messages = [
  new SystemMessage(`
   你是一个专业的代码解释助手，可以使用工具进行文件读取并解释

   1. 用户要求读取文件，请立即使用工具进行读取 
   2. 根据文件内容进行解释

   可用工具
   1. read_file 读取文件
`),
  new HumanMessage(`请读入文件 ./src/tool-file-read.js,并解释内容`),
];

const aiMessage = await modelWithTools.invoke(messages);

messages.push(aiMessage);

for (const tool of aiMessage.tool_calls) {
  const findTool = tools.find((v) => v.name === tool.name);
  if (!findTool) {
    messages.push(
      new ToolMessage({
        id: tool.id,
        content: `${tool.name} not find`,
      }),
    );
    continue;
  }

  const toolResult = await findTool.invoke(tool.args);

  messages.push(
    new ToolMessage({
      content: toolResult,
      tool_call_id: tool.id,
    }),
  );
}

console.log(await modelWithTools.invoke(messages));
