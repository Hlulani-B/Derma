import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());
app.post("/derma", async (req, res) => {  // changed GET to POST
    console.log("heyy",process.env.G_KEY);
    const genAI = new GoogleGenerativeAI(process.env.G_KEY);
    
    
    const { image } = req.body;

    
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-lite" });

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "image/png",
                    data: image,
                }
            },
            {
                text: `You are not making a medical diagnoses, you are just classifying the skin and a recommendation. this is mostly forminor skin conditions, just so one can go and buy a a skin care product that you can easilt get of the shelf.You are a skincare advisor, not a medical professional. Analyse this person's skin for cosmetic skincare purposes only. Identify skin type and cosmetic concerns like oiliness, dryness, acne, dark spots, or uneven texture. You must ALWAYS respond with valid JSON only, no text outside the JSON.

Return an array of objects: [{"condition": "", "risk": "low/medium/high", "formulations": "", "message": ""}]

risk levels mean: low=no action needed, medium=monitor it, high=see a dermatologist.
the formulations field must be an array of the skincare products or formulation. if you see something that is not skin or face just return empty string array. return only the things i tell you to return you qare breaking my code.
If the image is not a face or skin return: []. Note: you are not diagnosing. If the skin condition is deadly just put risk:high then in message: explain and include go and consult a doctor. must be in that json format. If the image is of something other than skincare just give empty array. I repeat empty array. never return only paragraphs or excuses.  remember that this is not a diagnosis, you are just identifying and giving suggestions. if risk is high or low, must include consult a doctor.`
            }
        ]);

        const text = result.response.text();
        console.log(text); 
        const clean = text.replace(/```json|```/g, "").trim(); 
const cleaned = clean.replace(/\*\*/g, "");
        const parsed = JSON.parse(cleaned); 

        
console.log("soo",parsed);
        res.json({ success: true, result: parsed }); 

    } catch (e) {
        console.log("error is", e);
        res.json({ success: false, result: [] });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));


import * as cheerio from 'cheerio'


async function getProduct(formulations){
    //['salicylic acid', 'retinoids']
   
   
try{
    for(const product of formulations){
        
        let encoded=encodeURIComponent(product);
        let  url=`https://www.caretobeauty.com/za/catalogsearch/result/?q=${encoded}`;
        let res=await fetch(url);
        let html=await res.text();

        let loadHtml= cheerio.load(html);
        let script_content='';
            loadHtml('script').each((i,el)=>{
                let text=loadHtml(el).html;
                if(text && text.includes('window.category_data')){
                    script_content=text;
                }

            });
            console.log(script_content);
            return{success:true, result:script_content};
        

    }
}catch(e){
    return {success:false,error:error.message};
}
}

app.get("/getProducts",async(req,res)=>{
   const {formulations}=req.body;
   const result= await getProduct(formulations);
   res.json(result);



});