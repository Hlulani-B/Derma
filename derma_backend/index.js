import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());
// Fallback model chain — tries each model until one accepts
const FALLBACK_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
];

const RESPONSE_SCHEMA = {
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
};

const ANALYSIS_PROMPT = `Analyse this image for cosmetic skincare purposes only. Identify skin characteristics, concerns (oiliness, dark spots, uneven texture), or visible lumps. 

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

If the image is not of skin, hair, or a scalp at all, return an empty array: []`;

function isRetryableError(error) {
    const msg = (error.message || "").toLowerCase();
    const status = error.status || error.statusCode;
    // 429 = rate limit, 503 = high demand / overloaded
    if (status === 429 || status === 503) return true;
    if (msg.includes("deprecated") || msg.includes("no longer available")) return true;
    if (msg.includes("high demand") || msg.includes("service unavailable")) return true;
    if (msg.includes("rate limit") || msg.includes("quota")) return true;
    if (msg.includes("fetch") || msg.includes("econnreset") || msg.includes("etimedout")) return true;
    return false;
}

app.post("/derma", async (req, res) => {
    const genAI = new GoogleGenerativeAI(process.env.G_KEY);
    const { image } = req.body;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
        const modelName = FALLBACK_MODELS[i];
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: RESPONSE_SCHEMA,
                }
            });

            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: "image/png",
                        data: image,
                    }
                },
                { text: ANALYSIS_PROMPT }
            ]);

            const text = result.response.text();
            console.log(`Success with model: ${modelName}`);
            const clean = text.replace(/```json|```/g, "").trim();
            const cleaned = clean.replace(/\*\*/g, "");
            const parsed = JSON.parse(cleaned);

            console.log("soo", parsed);
            return res.json({ success: true, result: parsed });

        } catch (e) {
            if (isRetryableError(e) && i < FALLBACK_MODELS.length - 1) {
                console.log(`Model ${modelName} failed (${e.message || e.status}), trying next...`);
                continue;
            }
            console.log(`All models exhausted or non-retryable error on ${modelName}:`, e.message || e);
            return res.json({ success: false, result: [] });
        }
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));


import * as cheerio from 'cheerio'

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
                    //console.log(match);
                   // console.log(result);
                    if (match && match[1]) {
                       try {
                            // Try parsing the raw string first without breaking escaped quotes
                            const parsedData = JSON.parse(match[1]);
                            result.push(parsedData);
                        } catch (parseError) {
                            console.error(` JSON Parse failed for ${product}. Trying fallback cleanup...`);
                            
                            try {
                                // Fallback: Clean up trailing commas or backslashes if absolutely necessary
                                let cleanedJson = match[1]
                                    .replace(/\\"/g, '"') // fix escaped quotes properly instead of dropping all slashes
                                    .replace(/,(\s*[\]}])/g, '$1'); // remove trailing commas
                                
                                result.push(JSON.parse(cleanedJson));
                            } catch (fallbackError) {
                                console.error(`❌ Fallback also failed:`, fallbackError.message);
                            }
                        }
                    }else{
                       
                console.log(`Warning: 'window.category_data' not found for product: ${match}`);
            
                    }
                }
            });

           
        }
console.log("Scraping completed successfully!");
//console.log("Hlulani",result);
        return { success: true, result };

    } catch (error) {
        return { success: false, error: error.message };
    }
}






async function  getImages(formulations){
    try{
    const products=await getProduct(formulations);
    const product=products.result || [];
    
   const result=[];
   for(let p of product){
    let arr=p.collection?.products;
    console.log(arr);
    for(let a of arr){
        if(result.length==12){
            break;
        }
       if (a.image) {
                    let img=a.image.replace(/\\/g, '');
                    if(!result.includes(img)){
                    result.push(img);
       }
                }

    }
   }
   console.log("Backend Successfully Compiled Images:", result);
    return {success:true,result:result};
    }catch(error){
  return {success:false,error:error.message};
    }

    

}

app.post("/getProducts",async(req,res)=>{
   const {formulations}=req.body;
   const result= await getImages(formulations);
   console.log("hehe",result);
   res.json(result);



});