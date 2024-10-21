// 儲存 API Key、Prompt 和影片資料
let apiKey = "";
let promptText = "";
let files = [];

// 取得 DOM 元素
const apiKeyInput = document.getElementById("apiKey");
const promptInput = document.getElementById("prompt"); // 新增
const videoFilesInput = document.getElementById("videoFiles");
const startButton = document.getElementById("startButton");
const fileListDiv = document.getElementById("fileList");

// 監聽 API Key 輸入
apiKeyInput.addEventListener("input", () => {
  apiKey = apiKeyInput.value.trim();
  checkReadyState();
});

// 監聽 Prompt 輸入
promptInput.addEventListener("input", () => {
  promptText = promptInput.value.trim();
});

// 監聽影片檔案上傳
videoFilesInput.addEventListener("change", () => {
  files = Array.from(videoFilesInput.files);
  displayFileList();
  checkReadyState();
});

// 檢查是否可開始辨識
function checkReadyState() {
  if (apiKey && files.length > 0) {
    startButton.disabled = false;
  } else {
    startButton.disabled = true;
  }
}

// 顯示檔案列表及預計花費
function displayFileList() {
  fileListDiv.innerHTML = "";
  files.forEach((file, index) => {
    const fileItemDiv = document.createElement("div");
    fileItemDiv.classList.add("file-item");
    fileItemDiv.id = `file-item-${index}`;

    const fileNameSpan = document.createElement("span");
    fileNameSpan.textContent = `檔案名稱：${file.name}`;

    const costSpan = document.createElement("span");
    costSpan.id = `cost-${index}`;

    const progressBarDiv = document.createElement("div");
    progressBarDiv.classList.add("progress-bar");

    const progressDiv = document.createElement("div");
    progressDiv.classList.add("progress");
    progressDiv.id = `progress-${index}`;

    progressBarDiv.appendChild(progressDiv);

    const statusSpan = document.createElement("span");
    statusSpan.id = `status-${index}`;
    statusSpan.textContent = "等待中...";

    // 將元素加入檔案項目中
    fileItemDiv.appendChild(fileNameSpan);
    fileItemDiv.appendChild(document.createElement("br"));
    fileItemDiv.appendChild(costSpan);
    fileItemDiv.appendChild(progressBarDiv);
    fileItemDiv.appendChild(statusSpan);

    // 將檔案項目加入檔案列表中
    fileListDiv.appendChild(fileItemDiv);

    // 計算影片時長和花費
    calculateCostAndDuration(file, index);
  });
}

// 計算花費和時長，並顯示
function calculateCostAndDuration(file, index) {
  const videoElement = document.createElement("video");
  videoElement.preload = "metadata";

  videoElement.onloadedmetadata = function () {
    window.URL.revokeObjectURL(videoElement.src);
    const duration = videoElement.duration;
    const minutes = duration / 60;
    const cost = (minutes * 0.006).toFixed(4);
    const costSpan = document.getElementById(`cost-${index}`);
    costSpan.textContent = `預計花費：$${cost}`;
    files[index].duration = duration; // 儲存時長
    files[index].cost = cost; // 儲存花費
  };

  videoElement.src = URL.createObjectURL(file);
}

// 開始辨識按鈕點擊事件
startButton.addEventListener("click", () => {
  // 禁用按鈕避免重複點擊
  startButton.disabled = true;
  apiKeyInput.disabled = true;
  promptInput.disabled = true; // 禁用 Prompt 輸入
  videoFilesInput.disabled = true;

  // 逐個處理檔案
  processFiles();
});

// 逐個處理檔案
function processFiles() {
  let currentIndex = 0;

  function processNext() {
    if (currentIndex >= files.length) {
      // 所有檔案已處理完畢
      alert("所有檔案已處理完畢！");
      return;
    }

    const file = files[currentIndex];
    const statusSpan = document.getElementById(`status-${currentIndex}`);
    statusSpan.textContent = "處理中，不要離開畫面...";

    transcribeAndConvert(file, currentIndex)
      .then(() => {
        statusSpan.textContent = "完成！";
        currentIndex++;
        processNext();
      })
      .catch((error) => {
        statusSpan.textContent = "發生錯誤：" + error.message;
        currentIndex++;
        processNext();
      });
  }

  processNext();
}

// 發送語音辨識並轉換字幕
// 開始辨識並轉換字幕
async function transcribeAndConvert(file, index) {
  const progressDiv = document.getElementById(`progress-${index}`);

  // 更新進度
  function updateProgress(percentage) {
    progressDiv.style.width = percentage + "%";
  }

  if (file.size <= 25 * 1024 * 1024) {
    // 將進度條設為 0%
    updateProgress(0);

    // 創建 FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", "whisper-1");
    formData.append("response_format", "srt");

    if (promptText) {
      formData.append("prompt", promptText);
    }
    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "語音辨識失敗，請確認您的 API Key 是否正確，或檢查配額是否足夠。"
        );
      }

      const result = await response.text();

      // 在上傳完成後，將進度條設為 100%
      updateProgress(100);

      // 繁體轉換
      const converter = OpenCC.Converter({ from: "cn", to: "tw" });
      const convertedResult = await converter(result);

      // 下載 srt 文件
      const blob = new Blob([convertedResult], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, "") + ".srt";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      throw error;
    }
  } else {
    // 文件大於25MB，需要切割
    try {
      await transcribeLargeFile(file, index, updateProgress);
    } catch (error) {
      throw error;
    }
  }
}

// 處理大型文件，切割並上傳
async function transcribeLargeFile(file, index, updateProgress) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // 讀取文件為 ArrayBuffer
  let arrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
    console.log("成功讀取文件為 ArrayBuffer");
  } catch (error) {
    console.error("讀取文件時發生錯誤：", error);
    throw new Error("讀取文件時發生錯誤。");
  }

  // 解碼音頻數據
  let audioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log("成功解碼音訊資料");
  } catch (error) {
    console.error("無法解碼音訊資料：", error);
    throw new Error("無法解碼音訊資料。");
  }

  const duration = audioBuffer.duration;
  const MAX_CHUNK_DURATION = 120; // 秒
  const totalChunks = Math.ceil(duration / MAX_CHUNK_DURATION);
  console.log(`總時長：${duration}秒，將被切割成 ${totalChunks} 個片段`);

  let transcripts = [];
  for (let i = 0; i < totalChunks; i++) {
    const startTime = i * MAX_CHUNK_DURATION;
    const endTime = Math.min((i + 1) * MAX_CHUNK_DURATION, duration);

    console.log(
      `正在處理第 ${i + 1} 個片段，時間範圍：${startTime} - ${endTime} 秒`
    );

    // 切割音頻
    let chunkBuffer;
    try {
      chunkBuffer = sliceAudioBuffer(
        audioBuffer,
        startTime,
        endTime,
        audioContext
      );
    } catch (error) {
      console.error(`切割音訊時發生錯誤：${error}`);
      throw new Error(`切割音訊時發生錯誤：片段 ${i + 1}`);
    }

    // 將 AudioBuffer 轉換為 WAV Blob
    let wavBlob;
    try {
      wavBlob = audioBufferToWavBlob(chunkBuffer);
    } catch (error) {
      console.error(`轉換音訊為 WAV Blob 時發生錯誤：${error}`);
      throw new Error(`轉換音訊為 WAV Blob 時發生錯誤：片段 ${i + 1}`);
    }

    // 創建 FormData 並上傳
    const formData = new FormData();
    formData.append("file", wavBlob, "chunk.wav");
    formData.append("model", "whisper-1");
    formData.append("response_format", "srt");

    if (promptText) {
      formData.append("prompt", promptText);
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`語音辨識失敗：${errorText}`);
        throw new Error(
          `語音辨識失敗，片段 ${
            i + 1
          }，請確認您的 API Key 是否正確，或檢查配額是否足夠。`
        );
      }

      const result = await response.text();
      transcripts.push({
        index: i,
        startTime: startTime,
        text: result,
      });

      // 更新進度
      updateProgress(Math.floor(((i + 1) / totalChunks) * 100));
      console.log(`片段 ${i + 1} 處理完成，進度已更新。`);
    } catch (error) {
      console.error(`處理片段 ${i + 1} 時發生錯誤：${error}`);
      throw new Error(`處理片段 ${i + 1} 時發生錯誤：${error.message}`);
    }
  }

  // 合併字幕
  const mergedSrt = mergeTranscripts(transcripts);

  // 繁體轉換
  const converter = OpenCC.Converter({ from: "cn", to: "tw" });
  const convertedResult = await converter(mergedSrt);

  // 下載 srt 文件
  const blob = new Blob([convertedResult], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = files[index].name.replace(/\.[^/.]+$/, "") + ".srt";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// 切割 AudioBuffer
function sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext) {
  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const endSample = Math.floor(endTime * audioBuffer.sampleRate);
  const frameCount = endSample - startSample;

  const numberOfChannels = audioBuffer.numberOfChannels;
  const newAudioBuffer = audioContext.createBuffer(
    numberOfChannels,
    frameCount,
    audioBuffer.sampleRate
  );

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const oldData = audioBuffer.getChannelData(channel);
    const newData = newAudioBuffer.getChannelData(channel);
    newData.set(oldData.subarray(startSample, endSample));
  }

  return newAudioBuffer;
}

// 將 AudioBuffer 轉換為 WAV Blob
function audioBufferToWavBlob(buffer) {
  const numOfChan = buffer.numberOfChannels,
    length = buffer.length * numOfChan * 2 + 44,
    bufferArray = new ArrayBuffer(length),
    view = new DataView(bufferArray),
    sampleRate = buffer.sampleRate;

  let offset = 0;

  // WAV 頭部
  function writeString(s) {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset++, s.charCodeAt(i));
    }
  }

  function writeUint32(d) {
    view.setUint32(offset, d, true);
    offset += 4;
  }

  function writeUint16(d) {
    view.setUint16(offset, d, true);
    offset += 2;
  }

  writeString("RIFF");
  writeUint32(length - 8);
  writeString("WAVE");

  writeString("fmt ");
  writeUint32(16);
  writeUint16(1);
  writeUint16(numOfChan);
  writeUint32(sampleRate);
  writeUint32(sampleRate * numOfChan * 2);
  writeUint16(numOfChan * 2);
  writeUint16(16);

  writeString("data");
  writeUint32(length - offset - 4);

  // 寫入 PCM 數據
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

// 合併多個 SRT 字幕
function mergeTranscripts(transcripts) {
  let mergedSrt = "";
  let index = 1;

  transcripts.sort((a, b) => a.startTime - b.startTime);

  for (const transcript of transcripts) {
    const srtContent = transcript.text;
    const lines = srtContent.trim().split("\n\n");
    for (const line of lines) {
      const parts = line.split("\n");
      if (parts.length >= 3) {
        const timeLine = parts[1];
        const textLines = parts.slice(2);

        // 調整時間戳
        const [startTimeStr, endTimeStr] = timeLine.split(" --> ");

        const startSeconds =
          timeStringToSeconds(startTimeStr) + transcript.startTime;
        const endSeconds =
          timeStringToSeconds(endTimeStr) + transcript.startTime;

        const newStartTimeStr = secondsToTimeString(startSeconds);
        const newEndTimeStr = secondsToTimeString(endSeconds);

        mergedSrt += `${index}\n${newStartTimeStr} --> ${newEndTimeStr}\n${textLines.join(
          "\n"
        )}\n\n`;
        index++;
      }
    }
  }

  return mergedSrt;
}

function timeStringToSeconds(timeStr) {
  const [hours, minutes, secondsAndMs] = timeStr.split(":");
  const [seconds, milliseconds] = secondsAndMs.split(",");
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds) +
    parseInt(milliseconds) / 1000
  );
}

function secondsToTimeString(seconds) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  seconds = seconds % 3600;
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  seconds = seconds % 60;
  const intSeconds = Math.floor(seconds).toString().padStart(2, "0");
  const milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000)
    .toString()
    .padStart(3, "0");
  return `${hours}:${minutes}:${intSeconds},${milliseconds}`;
}
