import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const model = new ChatOpenAI({
  temperature: 0,
  modelName: "qwen-plus",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-v3",
  configuration: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  },
});

const documents = [
  new Document({
    pageContent: `咪咪是一只胖乎乎的小白猫，它最喜欢在花园里的老槐树下打盹。咪咪性格很懒散，对什么事都提不起劲，唯独对美味的干小鱼情有独钟。`,
    metadata: {
      chapter: 1,
      character: "咪咪",
      type: "角色介绍",
      mood: "闲适",
    },
  }),
  new Document({
    pageContent: `青青是一只拥有翠绿色羽毛的小鸟，它住在老槐树的树顶。青青歌声婉转动听，是森林里有名的小歌唱家。它非常勤劳，每天清晨都会准时叫醒森林里的伙伴们。`,
    metadata: {
      chapter: 2,
      character: "青青",
      type: "角色介绍",
      mood: "欢快",
    },
  }),
  new Document({
    pageContent: `起初，咪咪总想扑捉在低处飞行的青青，把它当成猎物。但青青飞得很快，每次都轻盈地躲开，还落在树枝上对着咪咪叽叽喳喳地叫，仿佛在嘲笑这只笨拙的小猫。`,
    metadata: {
      chapter: 3,
      character: "咪咪和青青",
      type: "初次相遇",
      mood: "调皮",
    },
  }),
  new Document({
    pageContent: `有一天，咪咪在树下玩耍时不小心掉进了深坑里爬不出来。青青看到了，急忙飞到森林深处，找来了长长的藤蔓，并叫来其他小鸟一起把藤蔓的一头投给咪咪。在青青的指挥下，咪咪终于爬出了深坑。`,
    metadata: {
      chapter: 4,
      character: "咪咪和青青",
      type: "营救情节",
      mood: "紧张",
    },
  }),
  new Document({
    pageContent: `为了报答救命之恩，咪咪分享了自己珍藏的饼干屑给青青。它们坐在树荫下聊天，咪咪发现青青其实很孤独，因为它每天都在唱歌却没有人真正倾听。咪咪拍拍胸脯说：“以后，我就是你最忠实的听众！”`,
    metadata: {
      chapter: 5,
      character: "咪咪和青青",
      type: "友情升温",
      mood: "感动",
    },
  }),
  new Document({
    pageContent: `从那以后，老槐树下总能看到和谐的一幕：小白猫趴在草地上闭目养神，小翠鸟落在它的背上婉转歌唱。咪咪不再想抓鸟了，它觉得拥有一个会唱歌的朋友比拥有一顿晚餐更有趣。`,
    metadata: {
      chapter: 6,
      character: "咪咪和青青",
      type: "结局",
      mood: "温馨",
    },
  }),
  new Document({
    pageContent: `这个故事告诉我们，跨越物种的友谊是存在的。只要放下偏见，伸出援手，原本的“天敌”也能变成生命中最可靠的伙伴。`,
    metadata: {
      chapter: 7,
      character: "全体",
      type: "总结",
      mood: "启发",
    },
  }),
];

const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings,
);

const questions = ["咪咪和青青是怎么消除隔阂变成朋友的？"];

for (const question of questions) {
  console.log("=".repeat(80));
  console.log(`问题: ${question}`);
  console.log("=".repeat(80));

  const scoredResults = await vectorStore.similaritySearchWithScore(
    question,
    3,
  );

  console.log("\n【检索到的文档及相似度评分】");

  // 打印评分并提取文档内容
  scoredResults.forEach(([doc, score], i) => {
    // 通常分数越小表示越相似（欧氏距离），1 - score 仅作为直观参考
    const similarity = (1 - score).toFixed(4);

    console.log(`\n[文档 ${i + 1}] 相似度: ${similarity}`);
    console.log(`内容: ${doc.pageContent}`);
    console.log(
      `元数据: 章节=${doc.metadata.chapter}, 角色=${doc.metadata.character}, 类型=${doc.metadata.type}, 心情=${doc.metadata.mood}`,
    );
  });

  // 从 scoredResults 中提取文档构建 context
  const context = scoredResults
    .map(([doc], i) => `[片段${i + 1}]\n${doc.pageContent}`)
    .join("\n\n━━━━━\n\n");

  const prompt = `你是一个讲友情故事的老师。基于以下故事片段回答问题，用温暖生动的语言。如果故事中没有提到，就说"这个故事里还没有提到这个细节"。

故事片段:
${context}

问题: ${question}

老师的回答:`;

  // 使用 model.invoke
  console.log("\n【AI 回答】");
  const response = await model.invoke(prompt);
  console.log(response.content);
  console.log("\n");
}
