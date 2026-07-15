import sharp from "sharp";

const source = "public/brand/Location.png";
const destination = "public/brand/storefront.png";

sharp(source)
  .extract({ left: 300, top: 30, width: 1000, height: 760 })
  .png()
  .toFile(destination)
  .then(() => console.log(`Cropped ${source} to ${destination} (1000x760).`));
