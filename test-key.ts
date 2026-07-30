import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent('Hello');
    console.log("SUCCESS:");
    console.log(JSON.stringify(result, null, 2));
    console.log("TEXT:");
    console.log(await result.response.text());
  } catch (e: any) {
    console.error("ERROR:");
    console.error(e);
    if (e.status) console.error("Status:", e.status);
    if (e.response) console.error("Response:", e.response);
  }
}

test();
