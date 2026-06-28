import {useCallback,useRef,useState} from "react";
import { useNavigate } from "react-router-dom";
import "./photo.css"
import Webcam from "react-webcam";
import { CiCamera } from "react-icons/ci";
import { IoMdReverseCamera } from "react-icons/io";
import { IoArrowBackSharp } from "react-icons/io5";

export default function Photo({onCapture}){
    const navigate=useNavigate();
    const [image,setimage]=useState();
    const [facingmode, setfacingmode]=useState("user");
    const fmode=()=>{
        if(facingmode=="user"){
            setfacingmode("environment");
        }else{
            setfacingmode("user");
        }
    };
    const camref=useRef(null);
    const capture=useCallback(()=>{
            setimage(camref.current.getScreenshot());
},[camref]);


let vid={
    width:1280,
    height:720,
    facingMode:facingmode
}
    return(<section className="wrapper3">
        <h1>Derma</h1>
       {
       !image && <><Webcam
        videoConstraints={vid}
        width={1280}
        height={720}
        ref={camref}
        className="webcam"

        />
        <section className="sec">
            <button className="circle" onClick={fmode}><IoMdReverseCamera /></button>
            <button className="circle" onClick={capture}><CiCamera /></button>
            <button className="circle" onClick={()=>{ navigate(0); }}><IoArrowBackSharp /></button>
        </section>
       </>}

       {image && <>
       <img src={image} alt="picture"/>
       <section className="preview-btns">
       <button className="retake-btn" onClick={()=>{ setimage(null); }}>Retake</button>
       <button className="done-btn" onClick={()=>{ onCapture(image); }}>Done</button>
       <button className="back-btn" onClick={()=>{ navigate(0); }}><IoArrowBackSharp /></button>
       </section>
       </>}
           
    </section>);
}