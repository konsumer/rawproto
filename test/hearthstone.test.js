// tests that show how to actually parse some real protobuf, in a practical sense

/* global test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto, { query } from 'rawproto'

// build an initial array of the data I want to look at
// do this, and you can use getPath() to get values
const pb = await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin'))
const tree = new RawProto(pb).readMessage()

// since all is off of 1.2.4, this will optimize to pull from there
const appTree = query(tree, '1.2.4:sub').pop()

test('Get bytes of a sub-message with query', () => {
  const matches = query(tree, '1.2.4:bytes')
  expect(matches.length).toEqual(1)
  expect(matches[0].length).toEqual(15241)
})

test('Get id with query', () => {
  expect(query(appTree, '1:string').pop()).toEqual('com.blizzard.wtcg.hearthstone')
})

test('Get title with query', () => {
  expect(query(appTree, '5:string').pop()).toEqual('Hearthstone')
})

test('field with groups (manual sub-parse)', () => {
  // this gets more but is till not right
  const medias = query(appTree, '10:bytes').map((i) => {
    const t = new RawProto(i).readMessage()
    return {
      type: query(t, '1:uint').pop(),
      url: query(t, '5:string').pop()
    }
  })
  expect(medias.length).toEqual(10)

  // sort media by types
  const icon = medias.find((m) => m.type === 4).url
  const screenshots = medias.filter((m) => m.type === 1).map((m) => m.url)
  const videos = medias.filter((m) => m.type === 3).map((m) => m.url)
  const videoThumbs = medias.filter((m) => m.type === 13).map((m) => m.url)

  expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
  expect(screenshots.length).toEqual(6)
  expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
  expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
  expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
})

test('field with groups (using plain query)', () => {
  const types = query(appTree, '10.1:uint')
  const urls = query(appTree, '10.5:string')
  expect(types.length).toEqual(urls.length)

  // sort media by types
  const { icon, screenshots, videos, videoThumbs } = types.reduce(
    (a, t, i) => {
      // google's type-enum
      switch (t) {
        case 4:
          a.icon = urls[i]
          break
        case 1:
          a.screenshots.push(urls[i])
          break
        case 3:
          a.videos.push(urls[i])
          break
        case 13:
          a.videoThumbs.push(urls[i])
          break
      }
      return a
    },
    { screenshots: [], videos: [], videoThumbs: [] }
  )

  expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
  expect(screenshots.length).toEqual(6)
  expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
  expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
  expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
})

test('field with groups (using sub query off main, with sub-queries)', () => {
  let icon
  const screenshots = []
  const videos = []
  const videoThumbs = []
  for (const mediaItem of query(tree, '1.2.4.10:sub')) {
    const type = query(mediaItem, '1:uint').pop()
    const url = query(mediaItem, '5:string').pop()
    switch (type) {
      case 4:
        icon = url
        break
      case 1:
        screenshots.push(url)
        break
      case 3:
        videos.push(url)
        break
      case 13:
        videoThumbs.push(url)
        break
    }
  }
  expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
  expect(screenshots.length).toEqual(6)
  expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
  expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
  expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
})
