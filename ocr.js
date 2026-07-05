// --- OCR Feature Logic ---
window.processOcrImage = async function (inputElem, viewType) {
  const file = inputElem.files[0];
  if (!file) return;

  const previewContainer = document.getElementById(`ocrPreviewContainer_${viewType}`);
  const previewImg = document.getElementById(`ocrImagePreview_${viewType}`);
  const scrollWrapper = document.getElementById(`ocrScrollWrapper_${viewType}`);

  const btn = document.getElementById(`btnScanBill_${viewType}`);
  const scanIcon = document.getElementById(`scanIcon_${viewType}`);
  const scanText = document.getElementById(`scanText_${viewType}`);

  if (btn) btn.disabled = true;
  if (scanIcon) scanIcon.className = "fas fa-circle-notch fa-spin";
  if (scanText) scanText.textContent = "Scanning...";

  // Clear old overlays
  previewContainer.querySelectorAll('.ocr-lens-box').forEach(el => el.remove());

  // Display Image Preview
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;

    // Show the OCR panel and scroll wrapper
    const ocrPanel = document.getElementById(`ocrPanel_${viewType}`);
    if (ocrPanel) ocrPanel.style.display = 'block';
    if (scrollWrapper) scrollWrapper.style.display = 'block';

    // Show the toggle button
    const toggleBtn = document.getElementById(`btnToggleBill_${viewType}`);
    const toggleIcon = document.getElementById(`toggleOcrIcon_${viewType}`);
    if (toggleBtn) toggleBtn.style.display = 'flex';
    if (toggleIcon) toggleIcon.className = 'fas fa-chevron-up';
  };
  reader.readAsDataURL(file);

  try {
    if (typeof Tesseract === 'undefined') {
      alert("Tesseract.js failed to load. Please check your internet connection.");
      return;
    }

    // Wait slightly to ensure image is loaded for natural dimensions
    await new Promise(resolve => setTimeout(resolve, 100));

    const natW = previewImg.naturalWidth;
    const natH = previewImg.naturalHeight;

    if (!natW || !natH) {
      alert("Image dimensions not ready. Please try again.");
      return;
    }

    // Pre-process Image for Better OCR Accuracy (Scaling + Grayscale)
    const scale = 2.5; // Upscale by 2.5x to improve tiny text detection
    const canvas = document.createElement('canvas');
    const scaledW = natW * scale;
    const scaledH = natH * scale;
    canvas.width = scaledW;
    canvas.height = scaledH;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false; // Keep edges sharp

    // Apply filters before drawing to increase contrast and remove color noise
    ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
    ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);

    const processedDataUrl = canvas.toDataURL('image/jpeg', 1.0);

    // Run Tesseract
    const worker = await Tesseract.createWorker('eng');

    // Set Page Segmentation Mode to 11 (Sparse Text) for better table reading
    await worker.setParameters({
      tessedit_pageseg_mode: '11',
    });

    const ret = await worker.recognize(processedDataUrl);
    await worker.terminate();

    // Process Words
    const words = ret.data.words;
    if (!words || words.length === 0) {
      alert("No text detected in this image.");
    } else {
      words.forEach(wordObj => {
        const text = wordObj.text.trim();
        if (text) {
          const box = document.createElement('div');
          box.className = 'ocr-lens-box';
          // Make actual text content for native selection
          box.textContent = text;

          // Calculate percentages based on SCALED dimensions!
          const leftPct = (wordObj.bbox.x0 / scaledW) * 100;
          const topPct = (wordObj.bbox.y0 / scaledH) * 100;
          const widthPct = ((wordObj.bbox.x1 - wordObj.bbox.x0) / scaledW) * 100;
          const heightPct = ((wordObj.bbox.y1 - wordObj.bbox.y0) / scaledH) * 100;

          box.style.left = leftPct + '%';
          box.style.top = topPct + '%';
          box.style.width = widthPct + '%';
          box.style.height = heightPct + '%';

          // Estimate font size based on bounding box height to make selection feel natural
          // Height of box is (wordObj.bbox.y1 - wordObj.bbox.y0) in original pixels.
          // In the DOM, the image width is usually 1200px.
          const renderedHeight = (wordObj.bbox.y1 - wordObj.bbox.y0) * (1200 / scaledW);
          box.style.fontSize = (renderedHeight * 0.8) + 'px';

          previewContainer.appendChild(box);
        }
      });

      // Handle Native Selection & Single Click
      previewContainer.onmouseup = (e) => {
        setTimeout(() => {
          const selection = window.getSelection().toString().trim();
          if (selection) {
            // Drag selected multiple words
            const escapedText = selection.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            copyOcrWord(escapedText, e);
          } else if (e.target.classList.contains('ocr-lens-box')) {
            // Single clicked a word
            const text = e.target.textContent.trim();
            const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            copyOcrWord(escapedText, e);

            // Visual feedback for single click
            e.target.style.background = 'rgba(99, 102, 241, 0.4)';
            setTimeout(() => e.target.style.background = 'transparent', 200);
          }
        }, 10);
      };
    }
  } catch (err) {
    console.error("OCR Error:", err);
    alert("Error processing image. Please try again.");
  } finally {
    // Reset Button State
    if (btn) btn.disabled = false;
    if (scanIcon) scanIcon.className = "fas fa-search";
    if (scanText) scanText.textContent = "Scan Bill (OCR)";
    // Clear input to allow re-uploading the same file if needed
    inputElem.value = "";
  }
};

window.copyOcrWord = function (text, event) {
  // Decode HTML entities
  const parser = new DOMParser();
  const decodedText = parser.parseFromString(text, 'text/html').documentElement.textContent;

  const textToCopy = decodedText;

  navigator.clipboard.writeText(textToCopy).then(() => {
    // Show Tooltip
    let tooltip = document.getElementById('ocrGlobalTooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'ocrGlobalTooltip';
      tooltip.className = 'ocr-tooltip';
      tooltip.textContent = 'Copied!';
      document.body.appendChild(tooltip);
    }

    // Position tooltip near mouse
    tooltip.style.left = (event.clientX + 15) + 'px';
    tooltip.style.top = (event.clientY - 20) + 'px';

    // Animate
    tooltip.classList.remove('show');
    // Trigger reflow
    void tooltip.offsetWidth;
    tooltip.classList.add('show');

    setTimeout(() => {
      tooltip.classList.remove('show');
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
};

window.toggleOcrPanel = function (viewType) {
  const panel = document.getElementById(`ocrPanel_${viewType}`);
  const icon = document.getElementById(`toggleOcrIcon_${viewType}`);
  if (!panel || !icon) return;

  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    icon.className = 'fas fa-chevron-up';
  } else {
    panel.style.display = 'none';
    icon.className = 'fas fa-chevron-down';
  }
};
