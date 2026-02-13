export async function withTimeout(task, timeoutMs, errorMessage) {
  let timer = null;
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(errorMessage || "Request timed out."));
      }, timeoutMs);
    });
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
