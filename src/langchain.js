import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "qwen3-coder-30b-a3b-instruct",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const resopones = await model.invoke("介绍下自己");

console.log(resopones.content);
