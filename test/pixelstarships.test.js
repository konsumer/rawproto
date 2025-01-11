// Show how to actually parse some real protobuf, in a practical sense

/* global describe test expect */

import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { readFile } from 'fs/promises'
import RawProto from 'rawproto'

// build an initial array of the data I want to look at
const tree = new RawProto(await readFile(join(dirname(fileURLToPath(import.meta.url)), 'pixelstarships.bin')))
const appTree = tree.sub['1'][0].sub['2'][0].sub['4'][0]

test('Get fields of appTree', () => {
  // this is the counts of every field
  expect(appTree.fields).toEqual({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 8, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 21: 1, 24: 1, 25: 1, 26: 1, 27: 1, 29: 1, 32: 1, 34: 1, 38: 1, 39: 1, 40: 1, 43: 1, 45: 1, 46: 1, 48: 1, 50: 1, 51: 1 })
})

describe('Plain traversal', () => {
  test('Get id', () => {
    expect(appTree.sub['1'][0].string).toEqual('com.savysoda.pixelstarships')
  })

  test('Get title', () => {
    expect(appTree.sub['5'][0].string).toEqual('Pixel Starships™')
  })

  test('Get media', () => {
    // these are the same thing
    expect(appTree.sub['10'].length).toEqual(8)
    expect(appTree.fields[10]).toEqual(8)

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

    expect(icon).toEqual('https://play-lh.googleusercontent.com/lL32cn1Ix10RMs9n-2a29ExNp7fVrCVXT2dxVFjuuOA7lqsPUBrvNZrwk6iKiwFSmfk')
    expect(screenshots.length).toEqual(6)
    expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/pw21csjQMH1TelfH4aLKqJD26bya4E5yGjge7lJYugzYWGvRIz1fUM0DO1_f6h_i-ib-')
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

    expect(icon).toEqual('https://play-lh.googleusercontent.com/lL32cn1Ix10RMs9n-2a29ExNp7fVrCVXT2dxVFjuuOA7lqsPUBrvNZrwk6iKiwFSmfk')
    expect(screenshots.length).toEqual(6)
    expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/pw21csjQMH1TelfH4aLKqJD26bya4E5yGjge7lJYugzYWGvRIz1fUM0DO1_f6h_i-ib-')
  })
})

describe('Queries', () => {
  test('Get id', () => {
    expect(appTree.query('1:string')).toEqual(['com.savysoda.pixelstarships'])
  })

  test('Get title', () => {
    expect(appTree.query('5:string')).toEqual(['Pixel Starships™'])
  })

  test('Get media', () => {
    let icon
    let banner

    const screenshots = []
    const videos = []
    const videoThumbs = []

    for (const m of appTree.query('10')) {
      const t = m.query('1:int').pop()
      if (t === 1) screenshots.push(m.query('5:string').pop())
      if (t === 2) banner = m.query('5:string').pop()
      if (t === 3) videos.push(m.query('5:string').pop())
      if (t === 4) icon = m.query('5:string').pop()
      if (t === 13) videoThumbs.push(m.query('5:string').pop())
    }

    expect(banner).toEqual('https://play-lh.googleusercontent.com/KN0j-dja89hmXclYgqmUijc2M1z6MgmEG_1Nc6wQVk5URhxVR2drV7aPXTSO60I0Qw')

    expect(icon).toEqual('https://play-lh.googleusercontent.com/lL32cn1Ix10RMs9n-2a29ExNp7fVrCVXT2dxVFjuuOA7lqsPUBrvNZrwk6iKiwFSmfk')
    expect(screenshots.length).toEqual(6)
    expect(screenshots[0]).toEqual('https://play-lh.googleusercontent.com/pw21csjQMH1TelfH4aLKqJD26bya4E5yGjge7lJYugzYWGvRIz1fUM0DO1_f6h_i-ib-')
  })

  test('Groups', () => {
    const widths = appTree.query('10.2.3:int')
    const heights = appTree.query('10.2.4:int')
    expect(widths.length).toEqual(heights.length)
    expect(widths.length).toEqual(8)
  })

  test('Description', () => {
    expect(appTree.query('7:string').length).toEqual(1)
  })
})
