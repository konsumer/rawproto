// tests that show how to actually parse some real protobuf, in a practical sense

/* global test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// build an initial array of the data I want to look at
// do this, and you can use getPath() to get values
const tree = new RawProto(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))
const appTree = tree['1'][0]['2'][0]['4'][0]

test('Get fields of appTree', () => {
  expect(appTree.fields).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 10, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 21: 1, 24: 1, 25: 1, 26: 1, 27: 1, 29: 1, 32: 1, 34: 1, 38: 1, 39: 1, 40: 1, 43: 1, 45: 1, 46: 1, 48: 1, 50: 1, 51: 1 })
})

test('Get id', () => {
  expect(appTree['1'][0].string).toEqual('com.blizzard.wtcg.hearthstone')
})

test('Get title', () => {
  expect(appTree['5'][0].string).toEqual('Hearthstone')
})

test('Get media', () => {
  // these are the same thing
  expect(appTree['10'].length).toEqual(10)
  expect(appTree.fields[10]).toEqual(10)

  let icon
  const screenshots = []
  const videos = []
  const videoThumbs = []

  for (const m of appTree['10']) {
    const t = m['1'][0].int
    if ([4, 1, 3, 13].includes(t)) {
      if (m['5']?.length) {
        const url = m['5'][0].string
        if (t === 1) screenshots.push(url)
        if (t === 3) videos.push(url)
        if (t === 4) icon = url
        if (t === 13) videoThumbs.push(url)
      }
    }
  }

  expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
  expect(screenshots.length).toEqual(6)
  expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
  expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
  expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
})
