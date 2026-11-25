const $ = id => document.getElementById(id);
const promptBox = $("prompt");
let mode = "text";
let selectedFile = null;

function showNotice(message, error = false) {
  const box = $("notice");
  box.textContent = message;
  box.classList.remove("hidden", "error");
  if (error) box.classList.add("error");
}
function hideNotice() { $("notice").classList.add("hidden"); }

promptBox.addEventListener("input", () => $("charCount").textContent = `${promptBox.value.length} / 1,500`);
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  mode = tab.dataset.tab;
  $("imageUpload").classList.toggle("hidden", mode !== "image");
  hideNotice();
}));
$("imageFile").addEventListener("change", e => {
  selectedFile = e.target.files[0] || null;
  $("fileName").textContent = selectedFile ? selectedFile.name : "";
  if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
    showNotice("That image is larger than 10 MB. Please choose a smaller file.", true);
    selectedFile = null;
    e.target.value = "";
    $("fileName").textContent = "";
  }
});
$("ratio").addEventListener("change", () => {
  const value = $("ratio").value;
  $("previewRatio").textContent = `${value} · ${value === "9:16" ? "Portrait" : value === "1:1" ? "Square" : "Landscape"}`;
});
$("duration").addEventListener("change", () => $("previewDuration").textContent = `${$("duration").value} seconds`);
$("surprise").addEventListener("click", () => {
  const ideas = [
    "A tiny robot discovers a field of glowing flowers at sunrise, gentle camera push-in, dreamy cinematic lighting.",
    "A futuristic city floating above the clouds, airships drifting between glass towers, wide cinematic shot.",
    "A curious fox walking through an enchanted forest filled with fireflies, soft mist, magical atmosphere.",
    "An underwater train gliding past a coral city, shafts of sunlight, smooth tracking camera movement."
  ];
  promptBox.value = ideas[Math.floor(Math.random() * ideas.length)];
  promptBox.dispatchEvent(new Event("input"));
});
function getHistory() {
  try { return JSON.parse(localStorage.getItem("novaHistory") || "[]"); } catch { return []; }
}
function renderHistory() {
  const list = getHistory();
  const el = $("historyList");
  if (!list.length) {
    el.innerHTML = '<div class="empty-history"><span>✧</span><p>Your creations will show up here.</p></div>';
    return;
  }
  el.innerHTML = list.map(item => `<article class="history-item"><strong title="${escapeHtml(item.prompt)}">${escapeHtml(item.prompt)}</strong><small>${escapeHtml(item.date)} · ${escapeHtml(item.ratio)} · ${escapeHtml(item.duration)}s</small><span class="demo-tag">DEMO REQUEST</span></article>`).join("");
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
$("clearHistory").addEventListener("click", () => {
  localStorage.removeItem("novaHistory");
  renderHistory();
});
$("generate").addEventListener("click", async () => {
  hideNotice();
  const prompt = promptBox.value.trim();
  if (prompt.length < 8) return showNotice("Add a little more detail to your prompt before generating.", true);
  if (mode === "image" && !selectedFile) return showNotice("Choose an image to use as your starting frame.", true);
  if (mode === "image") return showNotice("Image-to-video is designed in the interface, but the server adapter needs to be extended to upload images to your chosen provider.", true);

  const button = $("generate");
  button.disabled = true;
  button.innerHTML = '<span>✦</span> Sending request…';
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt, ratio: $("ratio").value, duration: $("duration").value, style: $("style").value})
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Something went wrong.");
    const downloadLink = $("downloadVideo");
    downloadLink.classList.add("hidden");
    if (result.videoUrl) {
      const videoUrl = new URL(result.videoUrl, window.location.origin);
      if (videoUrl.origin === window.location.origin || videoUrl.protocol === "https:") {
        downloadLink.href = videoUrl.href;
        downloadLink.classList.remove("hidden");
      }
    }
    const history = getHistory();
    history.unshift({
      prompt, ratio: $("ratio").value, duration: $("duration").value,
      date: new Date().toLocaleString(), id: result.job.id
    });
    localStorage.setItem("novaHistory", JSON.stringify(history.slice(0, 12)));
    renderHistory();
    showNotice(result.message || "Your request was received. If the connected provider returns a video, the download button will appear below the preview.");
  } catch (err) {
    showNotice(err.message || "Could not reach the server. Is it running?", true);
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Generate video <b>→</b>';
  }
});
async function loadStatus() {
  try {
    const r = await fetch("/api/status");
    const data = await r.json();
    $("modeLabel").textContent = data.configured ? "Provider configured" : "Demo mode";
  } catch { $("modeLabel").textContent = "Offline"; }
}
renderHistory();
loadStatus();
