
import { useState } from 'react'
import { wireTypes } from 'rawproto'

const parseLabels = {
  int: 'Signed Integer',
  uint: 'Unsigned Integer',
  float: 'Decimal',
  bool: 'Boolean',
  string: 'String',
  bytes: 'Bytes',
  raw: 'Raw',
  sub: 'Sub-Message',
  packedint32: 'Packed Int32 Array',
  packedint64: 'Packed Int64 Array',
  packedvarint: 'Packed Variable-length Int Array'
}

const badgeColors = {}
badgeColors[wireTypes.VARINT] = 'default'
badgeColors[wireTypes.LEN] = 'primary'
badgeColors[wireTypes.I64] = 'accent'
badgeColors[wireTypes.I32] = 'secondary'
badgeColors[wireTypes.SGROUP] = 'primary'

const hex = (b) => [...b].map((c) => c.toString(16).padStart(2, '0')).join(' ')

export default function ProtoDisplay ({ open = false, tree, typeMap = {}, nameMap = {}, className }) {
  if (tree) {
    tree.renderType = 'sub'
  }
  return tree
    ? (
      <details className={className} open={open}>
        <summary>
          <div className={`badge badge-${badgeColors[tree.type]} gap-2`}>{tree.name || 'root (0)'}</div>
          <p className='text-gray-500 italic'>{parseLabels[tree.renderType]}</p>
        </summary>
        <ul>
          {Object.keys(tree?.sub || {}).map(n => tree.sub[n].map((field, fi) => {
            field.renderType = typeMap[field?.path] || field.renderType
            field.name = nameMap[field?.path] || n
            if (field.type === wireTypes.LEN && !['string', 'bytes'].includes(field.renderType)) {
              if (field.couldHaveSub) {
                field.renderType = 'sub'
                return (<li key={fi}><ProtoDisplay tree={field} typeMap={typeMap} nameMap={nameMap} /></li>)
              } else {
                field.renderType = field.likelyString ? 'string' : 'bytes'
                return (
                  <li key={fi}>
                    <ProtoField field={field} />
                  </li>
                )
              }
            } else {
              return (
                <li key={fi}>
                  <ProtoField field={field} />
                </li>
              )
            }
          }))}
        </ul>
      </details>
      )
    : null
}

export function ProtoField ({ field }) {
  if (field.renderType === 'bytes') {
    return (
      <div className='block'>
        <span className={`mr-2 badge badge-${badgeColors[field.type]}`}>{field.name}</span>
        <span className='mr-2 text-gray-500 italic'>{parseLabels[field.renderType]}</span>
        <span>{hex(field.bytes)}</span>
      </div>
    )
  }

  if (field.renderType === 'bool') {
    return (
      <div className='block'>
        <span className={`mr-2 badge badge-${badgeColors[field.type]}`}>{field.name}</span>
        <span className='mr-2 text-gray-500 italic'>{parseLabels[field.renderType]}</span>
        <span>{field[field.renderType] ? 'True' : 'False'}</span>
      </div>
    )
  }

  try {
    return (
      <div className='block'>
        <span className={`mr-2 badge badge-${badgeColors[field.type]}`}>{field.name}</span>
        <span className='mr-2 text-gray-500 italic'>{parseLabels[field.renderType]}</span>
        <span>{field[field.renderType]}</span>
      </div>
    )
  } catch (e) {
    // sometimes parsing as renderType fails
    return (
      <div className='block'>
        <span className={`bmr-2 adge badge-${badgeColors[field.type]}`}>{field.name}</span>
        <span className='mr-2 text-gray-500 italic'>{parseLabels[field.renderType]}</span>
      </div>
    )
  }
}
