export async function derma(image) {
    // convert blob URL to base64 in the browser
    const blob = await fetch(image).then(r => r.blob());
    const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(blob);
    });

    const result = await fetch(`http://localhost:3000/derma`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 })
    });
const data = await result.json();
console.log("result is", data);
return data;
}