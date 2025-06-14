import { NodeIO } from '@gltf-transform/core';
import { prune, textureCompress } from '@gltf-transform/functions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import sharp from 'sharp';
import draco3d from 'draco3d';

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node optimize-model.js <input.glb> <output.glb>');
  process.exit(1);
}

const inputPath = args[0];
const outputPath = args[1];

async function optimizeModel(inputFilePath, outputFilePath) {
  const io = new NodeIO();

  io.registerExtensions(ALL_EXTENSIONS);

  io.registerDependencies({
      'sharp': sharp,
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule()
    });

  console.log(`Loading model: ${inputFilePath}`);
  const document = await io.read(inputFilePath);

  console.log('Applying prune transformation...');
  await document.transform(prune({ keepEmptyRoots: true }));

  console.log('Applying texture compression...');
  await document.transform(textureCompress({
    targetFormat: 'webp',
    encoder: sharp
  }));

  console.log(`Saving optimized model: ${outputFilePath}`);
  await io.write(outputFilePath, document);
  console.log('Optimization complete!');
}

optimizeModel(inputPath, outputPath).catch((err) => {
  console.error('An error occurred during optimization:', err);
  process.exit(1);
});
