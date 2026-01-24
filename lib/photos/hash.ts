import sharp from "sharp";

export async function computeDHash(image: Buffer) {
  const width = 9;
  const height = 8;

  const raw = await sharp(image)
    .resize(width, height, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  let bits = "";
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const left = raw[y * width + x];
      const right = raw[y * width + x + 1];
      bits += left > right ? "1" : "0";
    }
  }

  return bits;
}
