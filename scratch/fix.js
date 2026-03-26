// JSZip はブラウザでも利用可能（CDNなどで読み込む前提）
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>

async function json_analyze(file) {
  // file: File オブジェクト（input[type=file] などから取得）
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // JSONファイル取得
  const jsonEntry = Object.values(zip.files).find(f => f.name.endsWith('.json'));
  if (!jsonEntry) return;
  const jsonText = await jsonEntry.async('string');
  const json = JSON.parse(jsonText);

  let array = [];
  array.push(file.name);
  const sprites = json.targets;
  array.push(sprites.length);
  array.push('divider');

  for (const value of sprites) {
    // ...existing code...
    const variables = Object.values(value.variables || {});
    array.push(variables.length);
    variables.forEach(hensus => {
      array.push(hensus[0]);
      array.push(hensus[1]);
    });
    const lists = Object.values(value.lists || {});
    array.push(lists.length);
    lists.forEach(list => {
      array.push(list[0]);
      array.push(list[1]);
    });
    const broadcasts = Object.values(value.broadcasts || {});
    array.push(broadcasts.length);
    broadcasts.forEach(message => {
      array.push(message);
    });
    array.push(value.costumes.length);
    for (const costume of value.costumes) {
      array.push(costume.name);
      const imgBuffer = await LoadFile(zip, costume.md5ext);
      if (imgBuffer) {
        const imgResult = await analyzeImage(imgBuffer);
        array.push(imgResult);
      } else {
        array.push("NO_IMAGE");
      }
    }
    array.push(value.sounds.length);
    for (const sound of value.sounds) {
      array.push(sound.name);
      const sndBuffer = await LoadFile(zip, sound.md5ext);
      if (sndBuffer) {
        const sndResult = await analyzeAudio(sndBuffer);
        array.push(sndResult);
      } else {
        array.push("NO_AUDIO");
      }
    }
    const blocks = Object.values(value.blocks || {});
    array.push(blocks.length);
    blocks.forEach(block => {
      array.push(block.opcode);
      array.push(block.next);
      array.push(block.parent);
      array.push(JSON.stringify(block.inputs));
      array.push(JSON.stringify(block.fields));
      array.push(block.shadow);
      array.push(block.topLevel);
    });
  }

  // CSVファイルとして保存（ブラウザではダウンロード）
  const csv = array.map(v => (typeof v === 'string' && v.includes(',') ? '"'+v.replace(/"/g,'""')+'"' : v)).join('\n') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name + '.csv';
  a.click();
  URL.revokeObjectURL(url);

  return array;
}

async function extractAndClassify(zipBinary) {
  const zip = await JSZip.loadAsync(zipBinary);

  const jsonFiles = [];
  const imageFiles = [];
  const audioFiles = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const lower = path.toLowerCase();

    if (lower.endsWith(".json")) {
      const content = await entry.async("string");
      jsonFiles.push({ path, content });
      continue;
    }

    if (/\.(svg|png|bmp|jpg|jpeg|gif|webp)$/.test(lower)) {
      const blob = await entry.async("blob");
      imageFiles.push({ path, blob });
      continue;
    }

    if (/\.(wav|mp3)$/.test(lower)) {
      const blob = await entry.async("blob");
      audioFiles.push({ path, blob });
      continue;
    }
  }
  return { jsonFiles, imageFiles, audioFiles };
}

async function LoadFile(zipBinary, Path) {
  let zip;
  if (typeof zipBinary === 'object' && typeof zipBinary.file === 'function') {
    zip = zipBinary;
  } else {
    zip = await JSZip.loadAsync(zipBinary);
  }
  const file = zip.file(Path);
  if (!file) return null;
  return await file.async('uint8array');
}

// 画像バイナリ解析（ブラウザ版）
async function analyzeImage(uint8arr) {
  try {
    const blob = new Blob([uint8arr], { type: 'image/png' }); // 実際はMIMEを判定すべき
    const url = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    URL.revokeObjectURL(url);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // メモリ節約のため、RGBA配列は返さず、メタ情報だけ返す例
    return {
      width: img.width,
      height: img.height,
      dataLength: imageData.data.length,
    };
  } catch (e) {
    return '9UNKNOWNIMG';
  }
}

// 音声バイナリ解析（ブラウザ版）
// 0.01秒ごとに周波数と音量を取得し、バイナリ形式で返す
async function analyzeAudio(uint8arr) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([uint8arr]);
    const url = URL.createObjectURL(blob);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // FFTサイズ
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    // 0.01秒ごとにサンプリング
    const intervalMs = 10;
    let startTime = 0;
    let samples = [];

    fetch(url)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioContext.destination);

        const duration = audioBuffer.duration; // 秒
        const totalSamples = Math.ceil(duration * 100); // 0.01秒単位のサンプル数

        // 音声は再生せず、AnalyserNodeからデータを取得
        const intervalId = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);

          // 周波数（最大成分のインデックスを簡易周波数として扱う）
          let maxIndex = 0;
          let maxValue = 0;
          for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxValue) {
              maxValue = dataArray[i];
              maxIndex = i;
            }
          }
          // インデックス → 周波数（概算）
          const freq = (maxIndex / bufferLength) * (audioContext.sampleRate / 2);

          // 音量（0〜100%）
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const volume = (sum / bufferLength / 255) * 100; // 0〜255 → 0〜100%

          samples.push({
            time: startTime,
            frequency: freq,
            volume: volume,
          });

          startTime += intervalMs / 1000;

          if (startTime >= duration) {
            clearInterval(intervalId);
            source.stop();
            audioContext.close().then(() => {
              URL.revokeObjectURL(url);

              // バイナリ形式で返す（例: 各サンプルを [time(4), freq(4), volume(1)] の9バイトで表現）
              const buffer = new ArrayBuffer(samples.length * 9);
              const view = new DataView(buffer);
              for (let i = 0; i < samples.length; i++) {
                const s = samples[i];
                view.setFloat32(i * 9, s.time, true);
                view.setFloat32(i * 9 + 4, s.frequency, true);
                view.setUint8(i * 9 + 8, Math.round(s.volume)); // 0〜100
              }
              resolve(new Uint8Array(buffer));
            });
          }
        }, intervalMs);

        source.start(0);
      })
      .catch(err => {
        URL.revokeObjectURL(url);
        reject('9UNKNOWNAUD');
      });
  });
}

// 使用例（HTML側）
// <input type="file" id="fileInput" accept=".sb3">
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await json_analyze(file);
});