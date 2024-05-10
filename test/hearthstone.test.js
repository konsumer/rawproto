// tests that show how to actually parse some real protobuf, in a practical sense

/* global describe test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// build an initial array of the data I want to look at
const tree = new RawProto(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'hearthstone.bin')))
const appTree = tree.sub['1'][0].sub['2'][0].sub['4'][0]

// for .map(), this will force types of fields, and give them names in .toJS()
const queryMap = {
  id: '1.2.4.1:string',
  idBytes: '1.2.4.2:bytes',
  title: '1.2.4.5:string',
  description: '1.2.4.7:string',
  mediaTypes: '1.2.4.10.1:int',
  mediaUrls: '1.2.4.10.5:string',
  mediaWidths: '1.2.4.10.2.3:int',
  mediaHeights: '1.2.4.10.2.4:int'
}

test('Get fields of appTree', () => {
  // this is the counts of every field
  expect(appTree.fields).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 10, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 21: 1, 24: 1, 25: 1, 26: 1, 27: 1, 29: 1, 32: 1, 34: 1, 38: 1, 39: 1, 40: 1, 43: 1, 45: 1, 46: 1, 48: 1, 50: 1, 51: 1 })
})

describe('Plain traversal', () => {
  test('Get id', () => {
    expect(appTree.sub['1'][0].string).toEqual('com.blizzard.wtcg.hearthstone')
  })

  test('Get title', () => {
    expect(appTree.sub['5'][0].string).toEqual('Hearthstone')
  })

  test('Get media', () => {
    // these are the same thing
    expect(appTree.sub['10'].length).toEqual(10)
    expect(appTree.fields[10]).toEqual(10)

    let icon
    const screenshots = []
    const videos = []
    const videoThumbs = []

    for (const m of appTree.sub['10']) {
      if (m.sub && m.sub['1']) {
        const t = m.sub['1'][0].int
        if ([4, 1, 3, 13].includes(t)) {
          if (m.sub['5']?.length) {
            const url = m.sub['5'][0].string
            if (t === 1) screenshots.push(url)
            if (t === 3) videos.push(url)
            if (t === 4) icon = url
            if (t === 13) videoThumbs.push(url)
          }
        }
      }
    }

    expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
    expect(screenshots.length).toEqual(6)
    expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
    expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
    expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
  })

  test('Groups', () => {
    let icon
    const screenshots = []
    const videos = []
    const videoThumbs = []

    for (const m of appTree.sub['10']) {
      if (m.sub && m.sub['1']) {
        const t = m.sub['1'][0].int
        if (t === 1) screenshots.push(m.sub['5'][0].string)
        if (t === 3) videos.push(m.sub['5'][0].string)
        if (t === 4) icon = m.sub['5'][0].string
        if (t === 13) videoThumbs.push(m.sub['5'][0].string)
      }
    }

    expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
    expect(screenshots.length).toEqual(6)
    expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
    expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
    expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
  })
})

describe('Queries', () => {
  test('Get id', () => {
    expect(appTree.query('1:string')).toEqual(['com.blizzard.wtcg.hearthstone'])
  })

  test('Get title', () => {
    expect(appTree.query('5:string')).toEqual(['Hearthstone'])
  })

  test('Get media', () => {
    let icon
    const screenshots = []
    const videos = []
    const videoThumbs = []

    for (const m of appTree.query('10')) {
      const t = m.query('1:int').pop()
      if (t === 1) screenshots.push(m.query('5:string').pop())
      if (t === 3) videos.push(m.query('5:string').pop())
      if (t === 4) icon = m.query('5:string').pop()
      if (t === 13) videoThumbs.push(m.query('5:string').pop())
    }

    expect(icon).toEqual('https://play-lh.googleusercontent.com/qTt7JkhZ-U0kevENyTChyUijNUEctA3T5fh7cm8yzKUG0UAnMUgOMpG_9Ln7D24NbQ')
    expect(screenshots.length).toEqual(6)
    expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/m-S0SqOv428DZcm46NJlyv0pffYpfsNjWz6iyf9LVM1TCWbzWs3clWaugjfzXXnCTbY')
    expect(videos).toEqual(['https://youtu.be/XT7YEb9_Muw'])
    expect(videoThumbs).toEqual(['https://i.ytimg.com/vi/XT7YEb9_Muw/hqdefault.jpg'])
  })

  test('Groups', () => {
    const widths = appTree.query('10.2.3:int')
    const heights = appTree.query('10.2.4:int')
    expect(widths.length).toEqual(heights.length)
    expect(widths.length).toEqual(7)
  })

  test('Description', () => {
    expect(appTree.query('7:string').length).toEqual(1)
  })
})

describe('Mapping', () => {
  test('make sure all members of fields are defined', () => {
    let counter = 0
    appTree.walk(field => {
      counter++
      expect(field.renderType).toBeDefined()
      expect(field.name).toBeDefined()
      expect(field.path).toBeDefined()
      expect(field.type).toBeDefined()
    }, queryMap)
    expect(counter).toEqual(637)
  })

  test('toJS', () => {
    const r = appTree.toJS('f', queryMap)

    // this checks queryMap
    expect(r.id).toEqual(['com.blizzard.wtcg.hearthstone'])
    expect(r.title).toEqual(['Hearthstone'])
    expect(r.description.length).toEqual(1)

    expect(r.mediaWidths.length).toEqual(r.mediaHeights.length)

    // type 2 media does not have URL
    expect(r.mediaTypes.filter(i => i !== 2).length).toEqual(r.mediaUrls.length)

    // this checks to make sure old mapping doesn't taint object
    const r2 = appTree.toJS()
    expect(r2.id).toBeUndefined()
    expect(r2.title).toBeUndefined()
    expect(r2.description).toBeUndefined()
  })

  test.skip('toProto', () => {
    const r = appTree.toProto('f', queryMap)
  })
})
