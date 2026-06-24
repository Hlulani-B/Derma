import { useLocation,useNavigate } from "react-router-dom";
import { derma } from "./function";
import { useState} from "react";
import Photo from "./photo";
import "./home.css"
import { getProduct } from "./getProduct";

export default function  Home(){
    const [image,setimage]=useState();
    const [choice,setchoice]=useState(false);
    const [res,setres]=useState(false);
    const [result,setresult]=useState([]);
    const [loading,setloading]=useState(false);
    


    const submit_picture=async()=>{
        setloading(true);
            const results=await derma(image);
            console.log(results);
            setloading(false);
 if (!results.result || results.result.length === 0) {
        alert(results.message || 'Could not analyze this photo. Please try again.');
        setimage(null);
        return;
    }

setresult(results.result);
await getProduct(results.result[0].formulations);
        // do ur thing 

        setimage(null);
        setres(true);

    };

// so we have the result and need to diplay it 
/*
    return(<section>
        <header><h2>Derma</h2></header>
        
        <section>
            
            
            
            
       {!image && <section className="top">     <input onClick={()=>{setresult(null);setres(false)}} type="file" accept="image/*"  onChange={e=>setimage(URL.createObjectURL(e.target.files[0]))}/>
            
<button onClick={() => {setchoice(true); setresult([]);setres(false);}}>Take selfie</button></section>}
{image && <p>image chosen</p>}


          {image &&  <section className="Top">
           <button onClick={submit_picture}>Use</button> 
           <button onClick={()=>{setimage(null);setres(false)}}>Clear</button>
            
            </section>}
            
        </section>
        {!image && choice && <>
            <Photo onCapture={(img) => {
    setimage(img);
    setchoice(false);
}} />


            
            </>}

            {res && <section className="result">
                <h2>Results:</h2>
                {result.map((obj,i)=>(
                    
                    <section className="object" key={i}>
                        
                    <h1>{obj.condition}</h1>
                    <h1>Risk: {obj.risk}</h1>
                    {obj.risk === "high" && <h1>You might want to consult a doctor!!</h1>}
                    {obj.risk === "medium" && <h1>You might want to consider seeing a doctor but it's no big deal.</h1>}
                    <p>{obj.message}</p>

                    
                    </section>
                ))}
                
                
                
                </section>}




            

    </section>);

    */


    // we have three pages


    return(<section>


<section>
{!image && !choice &&
<section className="wrapper1">
    <section className="part1">
        <h1>Derma</h1>
        <p className="paragraph1"><strong>Know your skin. Know your products. </strong>
        Take a photo, get an instant skin analysis, and discover the products formulated for you.</p>
        <button><a href="#part2" style={{testDecoration:'none', color: 'inherit'}}>Analyse My Skin</a></button>


    </section>

    <section id="part2"className="part2">
        <h2>Understand Your Skin, Get the Right Care</h2>
        <p>Upload a clear photo of your skin to receive an instant analysis of its condition. We'll help identify what you're dealing with and recommend the right treatment for it. If your skin condition appears serious, we'll let you know and recommend seeing a doctor — so you always get the right level of care, not just a product.</p>

         <input className="beyonce" onClick={()=>{setresult(null);setres(false)}} type="file" accept="image/*"  onChange={e=>setimage(URL.createObjectURL(e.target.files[0]))}/>
        
        <button onClick={() => {setchoice(true); setresult([]);setres(false);}}>Take selfie</button>


    </section>











</section>






}
</section>
<section>
{!image && choice && <>
            <Photo onCapture={(img) => {
    setimage(img);
    setchoice(false);
}} />


            
            </>}

</section>
<section>
{!res && image &&<section className="imagee">
    
{image && <p>image chosen</p>}


          {image &&  <section className="Top">
           <button onClick={submit_picture}>Use</button> 
           <button onClick={()=>{setimage(null);setres(false)}}>Clear</button>
            
            </section>}


            {loading && <h1>
                Analysing skin...
                </h1>}
            </section>}
</section>

<section>

    
</section>
 { res && <section className="result">
                <h2>Results:</h2>
                {result.map((obj,i)=>(
                    
                    <section className="object" key={i}>
                        
                    <h1>{obj.condition}</h1>
                    <h1>Risk: {obj.risk}</h1>
                    {obj.risk === "high" && <h1>You need to consult a doctor!!</h1>}
                    {obj.risk === "medium" && <h1>You might want to consider seeing a doctor but it's no big deal.</h1>}
                    <p>{obj.message}</p>

                    
                    </section>
                ))}
                
                
                
                </section>}


    </section>);
}