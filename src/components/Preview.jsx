export default function Preview() {
  const handlePreview = async () => {
    const payload = [/* JSON 데이터 */];

    try {
      const response = await fetch("http://localhost:8000/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const { html, css } = await response.json();

      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      previewWindow.document.write(`
        <html>
          <head><style>${css}</style></head>
          <body>${html}</body>
        </html>
      `);
      previewWindow.document.close();
    } catch (error) {
      console.error("Preview error:", error);
    }
  };


  return <button onClick={handlePreview}
          className="px-3 py-1 rounded bg-blue-600 text-white"
         >Preview</button>;
}
