// Stand-in for transformers.js: reports model download progress like the real library, then "listens" for 2.5 s.
export const env = { backends: { onnx: { wasm: {} } } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function pipeline(task, model, opts) {
  const files = [['config.json', 2e3], ['encoder_model_quantized.onnx', 8e6], ['decoder_model_merged_quantized.onnx', 3e7]];
  for (let step = 0; step <= 10; step++) {
    for (const [file, total] of files) opts.progress_callback({ status: 'progress', file, loaded: total * step / 10, total, progress: step * 10 });
    await sleep(120);
  }
  return async (audio, o) => { await sleep(2500); return { text: ' robot voices', chunks: [{ text: ' robot', timestamp: [0.4, 0.9] }, { text: ' voices', timestamp: [0.9, 1.8] }] }; };
}
