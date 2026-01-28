import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import fs from "node:fs/promises";
import {
  readfileTool,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { z } from "zod";
import path from "node:path";
import { spawn } from "node:child_process";

const model = new ChatOpenAI({
  modelName: "qwen3-coder-30b-a3b-instruct",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const tools = [readfileTool];

const modelWithTools = model.bindTools(tools);

const messages = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。

工作流程：
1. 用户要求读取文件时，立即调用 read_file 工具
2. 等待工具返回文件内容
3. 基于文件内容进行分析和解释

可用工具：
- read_file: 读取文件内容（使用此工具来获取文件内容）
`),
  new HumanMessage("请读取 ./src/tool-file-read.js 文件内容并解释代码"),
];

let resopnes = await modelWithTools.invoke(messages);

console.log(resopnes);

messages.push(resopnes);

while (resopnes.tool_calls && resopnes.tool_calls.length > 0) {
  const tooresults = await Promise.all(
    resopnes.tool_calls.map(async (toolCall) => {
      const tool = tools.find((t) => t.name === toolCall.name);
      if (!tool) {
        return "错误:没找到工具";
      }
      try {
        return await tool.invoke(toolCall.args);
      } catch (error) {
        return error.messages;
      }
    }),
  );
  resopnes.tool_calls.forEach((toolCall, index) => {
    messages.push(
      new ToolMessage({
        content: tooresults[index],
        tool_call_id: toolCall.id,
      }),
    );
  });
  resopnes = await modelWithTools.invoke(messages);
}

console.log(resopnes);
