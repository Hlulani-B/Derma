


export async function getProduct(formulations){
    console.log("🚀 getProduct function started! Formulations passed:", formulations);
    //['salicylic acid', 'retinoids']
   try {

    const result = await fetch(`https://api-treupobaqq-uc.a.run.app/getProducts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formulations:formulations })
        });


    const data = await result.json(); 
        console.log("The one and only", data);
        return data.result;


   } catch (error) {
    console.log(error);
   }
   

}
