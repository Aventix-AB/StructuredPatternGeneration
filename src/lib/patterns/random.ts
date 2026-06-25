export function mulberry32(seed: number): () => number {
    let t = seed >>> 0
    return function next() {
        t += 0x6d2b79f5
        let v = Math.imul(t ^ (t >>> 15), t | 1)
        v ^= v + Math.imul(v ^ (v >>> 7), v | 61)
        return ((v ^ (v >>> 14)) >>> 0) / 4294967296
    }
}

export function randomInt(next: () => number, min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min
}
