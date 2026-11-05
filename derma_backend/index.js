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

IMPORTANT: For the "formulations" field, be SPECIFIC and list actual product types that can be searched on skincare websites. Use specific product names like:
- "hyaluronic acid serum" or "vitamin C serum" (not just "serum")
- "salicylic acid cleanser" or "glycolic acid cleanser" (not just "cleanser")
- "niacinamide moisturizer" or "ceramide cream" (not just "moisturizer")
- "retinol night cream" or "retinoid serum" (not just "retinoids")
- "SPF 50 sunscreen" or "mineral sunscreen" (not just "sunscreen")
- "BHA exfoliant" or "AHA toner" (not just "exfoliant")
- "dark spot corrector" or "brightening serum"
- "oil control moisturizer" or "matte sunscreen"

Expected Output Format:
[
  {
    "condition": "Specific skin concern (e.g., 'Acne', 'Hyperpigmentation', 'Fine lines', 'Dryness', 'Excess oil')",
    "risk": "low" | "medium" | "high",
    "formulations": ["List 2-3 SPECIFIC product types with active ingredients"],
    "message": "Detailed advice including which specific ingredients to look for and why"
  }
]

Example for acne-prone skin:
[
  {
    "condition": "Acne and clogged pores",
    "risk": "low",
    "formulations": ["salicylic acid cleanser", "niacinamide serum", "oil-free moisturizer"],
    "message": "Look for products with salicylic acid to unclog pores, niacinamide to reduce inflammation, and oil-free formulas to prevent breakouts."
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

// Extract product images from HTML using multiple strategies
function extractProductImages(html) {
    const $ = cheerio.load(html);
    const images = [];
    
    // Strategy 1: Look for product cards with images
    $('.product-item img, .product-card img, .product-image img, [class*="product"] img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
        if (src && !src.includes('data:image') && !src.includes('placeholder') && !src.includes('logo') && !src.includes('icon')) {
            const cleanSrc = src.replace(/\\/g, '').split('?')[0]; // Remove query params
            if (cleanSrc.startsWith('http') && !images.includes(cleanSrc)) {
                images.push(cleanSrc);
            }
        }
    });
    
    // Strategy 2: Look for any large images (likely product images)
    if (images.length === 0) {
        $('img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            const width = $(el).attr('width');
            const height = $(el).attr('height');
            
            // Filter for likely product images (skip small icons)
            if (src && !src.includes('data:image') && !src.includes('placeholder') && 
                !src.includes('logo') && !src.includes('icon') &&
                (!width || width > 100) && (!height || height > 100)) {
                const cleanSrc = src.replace(/\\/g, '').split('?')[0];
                if (cleanSrc.startsWith('http') && !images.includes(cleanSrc)) {
                    images.push(cleanSrc);
                }
            }
        });
    }
    
    // Strategy 3: Look for image URLs in the HTML source
    if (images.length === 0) {
        const urlMatches = html.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?/gi) || [];
        for (const url of urlMatches) {
            const cleanUrl = url.split('?')[0];
            if (!cleanUrl.includes('logo') && !cleanUrl.includes('icon') && !images.includes(cleanUrl)) {
                images.push(cleanUrl);
            }
            if (images.length >= 12) break;
        }
    }
    
    return images.slice(0, 12); // Limit to 12 images
}

async function getProduct(formulations) {
    const result = [];

    try {
        // Map common skincare terms to actual product searches
        const searchTerms = {
            'general skincare routine': ['moisturizer', 'cleanser', 'sunscreen'],
            'skincare': ['moisturizer', 'serum'],
            'routine': ['cleanser', 'moisturizer'],
            'moisturizer': ['moisturizer', 'cream'],
            'cleanser': ['cleanser', 'face wash'],
            'sunscreen': ['sunscreen', 'SPF'],
            'serum': ['serum', 'vitamin c'],
            'retinoids': ['retinol', 'retinoid'],
            'salicylic acid': ['salicylic acid', 'BHA'],
            'dark spots': ['dark spot corrector', 'vitamin c serum'],
            'oiliness': ['oil control', 'matte moisturizer'],
            'uneven texture': ['exfoliant', 'AHA'],
        };

        for (const formulation of formulations) {
            const searchKey = formulation.toLowerCase();
            const searchProducts = searchTerms[searchKey] || [formulation];
            
            for (const searchTerm of searchProducts) {
                const encoded = encodeURIComponent(searchTerm);
                const url = `https://www.caretobeauty.com/za/catalogsearch/result/?q=${encoded}`;
                
                try {
                    const res = await fetch(url, {
                        method: "GET",
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5'
                        }
                    });
                    
                    if (!res.ok) {
                        console.log(`HTTP ${res.status} for: ${searchTerm}`);
                        continue;
                    }
                    
                    const html = await res.text();
                    const images = extractProductImages(html);
                    
                    if (images && images.length > 0) {
                        result.push({ product: searchTerm, images });
                        console.log(`✅ Found ${images.length} images for: ${searchTerm}`);
                        break; // Found images, no need to try other search terms
                    } else {
                        console.log(`⚠️ No images found for: ${searchTerm}`);
                    }
                } catch (fetchError) {
                    console.log(`❌ Error fetching ${searchTerm}:`, fetchError.message);
                }
            }
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
        const data = products.result || [];

        const result = [];
        for (const p of data) {
            const images = p.images || [];
            for (const img of images) {
                if (result.length >= 12) break;
                if (!result.includes(img)) {
                    result.push(img);
                }
            }
        }
        console.log("Backend Successfully Compiled Images:", result);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

app.post("/getProducts",async(req,res)=>{
   const {formulations}=req.body;
   const result= await getImages(formulations);
   console.log("hehe",result);
   res.json(result);



});