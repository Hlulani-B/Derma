import { useNavigate } from "react-router-dom";
import { derma } from "./function";
import { useState, useRef } from "react";
import Photo from "./photo";
import "./home.css"
import { getProduct } from "./getProduct";



export default function Home() {
    const resultRef = useRef(null);
    const [image, setimage] = useState();
    const [choice, setchoice] = useState(false);
    const [res, setres] = useState(false);
    const [result, setresult] = useState([]);
    const [loading, setloading] = useState(false);
    const [selectedImg, setSelectedImg] = useState(null); // 👈 for popup


    const submit_picture = async () => {
        setloading(true);
        const results = await derma(image);
        console.log(results);

        if (!results.result || results.result.length === 0) {
            alert(results.message || 'Could not analyze this photo. Please try again.');
            setimage(null);
            setloading(false);
            return;
        }

        for (let res of results.result) {
            let product = await getProduct(res.formulations);
            res.product = product;
        }

        setresult(results.result);
        setloading(false);
        setimage(null);
        setres(true);

        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // so we have the result and need to display it
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

    return (
        <section className="app-wrapper">

            {/* popup */}
            {selectedImg && (
                <div className="popup-overlay" onClick={() => setSelectedImg(null)}>
                    <div className="popup-box" onClick={e => e.stopPropagation()}>
                        <button className="popup-close" onClick={() => setSelectedImg(null)}>✕</button>
                        <img src={selectedImg} alt="" className="popup-img" />
                    </div>
                </div>
            )}

            <section>
                {!image && !choice && (
                    <section className="wrapper1">

                        <section className="part1">
                            <h1>Derma</h1>
                            <p className="paragraph1">
                                <strong>Know your skin. Know your products.</strong><br />
                                Take a photo, get an instant skin analysis, and discover the products formulated for you.
                            </p>
                            <button className="hero-btn">
                                <a href="#part2" style={{ textDecoration: 'none', color: 'inherit' }}>Analyse My Skin ↓</a>
                            </button>
                        </section>

                        <section id="part2" className="part2">
                            <div className="part2-inner">
                                <h2>Understand Your Skin, Get the Right Care</h2>
                                <p>Upload a clear photo of your skin to receive an instant analysis. We'll identify what you're dealing with and recommend the right treatment — and if it's serious, we'll tell you to see a doctor.</p>
                                <div className="upload-area">
                                    <input
                                        className="beyonce"
                                        onClick={() => { setresult(null); setres(false); }}
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setimage(URL.createObjectURL(e.target.files[0]))}
                                    />
                                    <div className="divider"><span>or</span></div>
                                    <button className="selfie-btn" onClick={() => { setchoice(true); setresult([]); setres(false); }}>
                                        Take a Selfie
                                    </button>
                                </div>
                            </div>
                        </section>

                    </section>
                )}
            </section>

            <section>
                {!image && choice && (
                    <Photo onCapture={(img) => {
                        setimage(img);
                        setchoice(false);
                    }} />
                )}
            </section>

            <section>
                {!res && image && (
                    <section className="imagee">
                        <div className="imagee-card">
                            <p className="imagee-text">Your photo is ready!</p>
                            {loading
                                ? <div className="loading-state">
                                    <div className="spinner" />
                                    <p>Analysing your skin...</p>
                                </div>
                                : <section className="imagee-btns">
                                    <button className="use-btn" onClick={submit_picture}>Analyse</button>
                                    <button className="clear-btn" onClick={() => { setimage(null); setres(false); }}>Clear</button>
                                </section>
                            }
                        </div>
                    </section>
                )}
            </section>

            {res && (
                <section className="result" ref={resultRef}>
                    <div className="result-header">
                        <h2>Your Skin Results</h2>
                        <p className="result-subtitle">Here's what we found and what we recommend for you</p>
                    </div>

                    {result.map((obj, i) => (
                        <section className="object" key={i}>

                            <div className="object-top">
                                <div className={`risk-pill risk-${obj.risk}`}>{obj.risk} risk</div>
                                <h1>{obj.condition}</h1>
                                {obj.risk === "high" && (
                                    <div className="alert-box high">Please consult a dermatologist for this condition.</div>
                                )}
                                {obj.risk === "medium" && (
                                    <div className="alert-box medium">Consider seeing a doctor, but it's not urgent.</div>
                                )}
                                <p>{obj.message}</p>
                                <div className="formulations">
                                    <p className="formulations-label">Key Ingredients</p>
                                    <div className="formulations-list">
                                        {obj.formulations?.map((f, j) => (
                                            <span className="formulation-tag" key={j}>{f}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="products-section">
                                <p className="products-label">Recommended Products</p>
                                <section className="images">
                                    {obj.product?.map((img, j) => (
                                        <div className="image-card" key={j} onClick={() => setSelectedImg(img)}> {/* 👈 */}
                                            <img src={img} alt="" />
                                        </div>
                                    ))}
                                </section>
                            </div>

                        </section>
                    ))}
                </section>
            )}

        </section>
    );
}