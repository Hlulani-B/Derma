


export async function getProduct(formulations){
    console.log("🚀 getProduct function started! Formulations passed:", formulations);
    //['salicylic acid', 'retinoids']
   try {
        const result = await fetch(`/getProducts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formulations:formulations })
        });

        if (!result.ok) {
            throw new Error(`HTTP error! status: ${result.status}`);
        }

        const data = await result.json(); 
        console.log("The one and only", data);
        return data.result || [];

   } catch (error) {
        console.error("Error in getProduct:", error);
        return [];
   }
}
