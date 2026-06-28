import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";

const G_KEY = defineSecret("G_KEY");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: true }));

app.post("/derma", async (req, res) => {

    const genAI = new GoogleGenAI({ apiKey: G_KEY.value() });

    const { image } = req.body;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/png",
                                data: image,
                            }
                        },
                        {
                            text: `Analyse this image for cosmetic skincare purposes only. Identify skin characteristics, concerns (oiliness, dark spots, uneven texture), or visible lumps. 

CRITICAL SAFETY RULE: If the image depicts a complex medical condition, a structural lump, an unknown growth, or anything that requires an absolute medical evaluation, set the risk to "high" and use the message field to instruct them to see a dermatologist. 

You must ALWAYS respond with a valid JSON array of objects following this exact structure, even if you are refusing to analyse or recommending a doctor. No conversational text outside of the JSON.

Expected Output Format:
[
  {
    "condition": "Name of cosmetic concern or visible feature",
    "risk": "low" | "medium" | "high",
    "formulations": ["Product type or active ingredient choice"],
    "message": "Advice, explanation, or medical disclaimer if risk is high"
  }
]

If the image is not of skin, hair, or a scalp at all, return an empty array: []`
                        }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            condition: { type: "STRING" },
                            risk: { type: "STRING" },
                            formulations: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            message: { type: "STRING" }
                        },
                        required: ["condition", "risk", "formulations", "message"]
                    }
                }
            }
        });

        const text = result.text;
        console.log(text);
        const clean = text.replace(/```json|```/g, "").trim();
        const cleaned = clean.replace(/\*\*/g, "");
        const parsed = JSON.parse(cleaned);

        console.log("soo", parsed);
        res.json({ success: true, result: parsed });

    } catch (e) {
        console.log("error is", e);
        res.json({ success: false, result: [] });
    }
});


async function getProduct(formulations) {
    const result = [];

    try {
        for (const product of formulations) {

            let encoded = encodeURIComponent(product);
            let url = `https://www.caretobeauty.com/za/catalogsearch/result/?q=${encoded}`;
            let res = await fetch(url, {
                method: "GET",
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });
            let html = await res.text();

            let loadHtml = cheerio.load(html);

            loadHtml('script').each((i, el) => {
                let script_content = loadHtml(el).html();
                if (script_content && script_content.includes('window.category_data')) {
                    let match = script_content.match(/window\.category_data\s*=\s*(\{[\s\S]*?\});/);
                    if (match && match[1]) {
                        try {
                            const parsedData = JSON.parse(match[1]);
                            result.push(parsedData);
                        } catch (parseError) {
                            console.error(`JSON Parse failed for ${product}. Trying fallback cleanup...`);

                            try {
                                let cleanedJson = match[1]
                                    .replace(/\\"/g, '"')
                                    .replace(/,(\s*[\]}])/g, '$1');

                                result.push(JSON.parse(cleanedJson));
                            } catch (fallbackError) {
                                console.error(`❌ Fallback also failed:`, fallbackError.message);
                            }
                        }
                    } else {
                        console.log(`Warning: 'window.category_data' not found for product: ${match}`);
                    }
                }
            });
        }

        console.log("Scraping completed successfully!");
        return { success: true, result };

    } catch (error) {
        return { success: false, error: error.message };
    }
}


async function getImages(formulations) {
    try {
        const products = await getProduct(formulations);
        const product = products.result || [];

        const result = [];
        for (let p of product) {
            let arr = p.collection?.products;
            console.log(arr);
            for (let a of arr) {
                if (result.length == 12) break;
                if (a.image) {
                    let img = a.image.replace(/\\/g, '');
                    if (!result.includes(img)) {
                        result.push(img);
                    }
                }
            }
        }

        console.log("Backend Successfully Compiled Images:", result);
        return { success: true, result: result };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

app.post("/getProducts", async (req, res) => {
    const { formulations } = req.body;
    const result = await getImages(formulations);
    console.log("hehe", result);
    res.json(result);
});

export const api = onRequest({ secrets: ["G_KEY"] }, app);