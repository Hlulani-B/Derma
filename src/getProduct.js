import * as cheerio from 'cheerio'


export async function getProduct(formulations){
    //['salicylic acid', 'retinoids']
   try {

    const result = await fetch(`http://localhost:3000/getProducts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formulations })
        });
    console.log(result);
   } catch (error) {
    console.log(error);
   }
   

}