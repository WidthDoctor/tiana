import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { cache } from 'react';
import SliderClient from './SliderClient';

const sliderDirectory = path.join(process.cwd(), 'public', 'images', 'homeSlider');

const getSliderImages = cache(async function getSliderImages() {
    try {
        const files = await readdir(sliderDirectory);

        return files
            .filter((fileName) => /\.(png|jpe?g|webp|avif|gif)$/i.test(fileName))
            .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }))
            .map((fileName) => ({
                src: `/images/homeSlider/${fileName}`,
                alt: fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
            }));
    } catch {
        return [];
    }
});

export default async function Slider() {
    const images = await getSliderImages();

    return <SliderClient images={images} />;
}