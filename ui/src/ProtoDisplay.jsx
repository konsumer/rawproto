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

export default function ProtoDisplay ({ open = false, tree, typeMap = {}, nameMap = {}, index = 0, className }) {
  const [o, setO] = useState(open)
  if (tree) {
    tree.renderType = 'sub'
  }
  return tree
    ? (
      <details open={o} className={className}>
        <summary>
          <div className={`badge badge-${badgeColors[tree.type]} gap-2`}>{index}</div>
          <p className='text-gray-500 italic'>{parseLabels[tree.renderType]}</p>
        </summary>
        <ul>
          {Object.keys(tree?.sub || {}).map(n => tree.sub[n].map((field, fi) => {
            field.renderType = typeMap[field?.path] || field.renderType
            if (field.type === wireTypes.LEN && !['string', 'bytes'].includes(field.renderType)) {
              if (field.couldHaveSub) {
                field.renderType = 'sub'
                return (<li key={fi}><ProtoDisplay index={n} tree={field} typeMap={typeMap} nameMap={nameMap} /></li>)
              } else {
                field.renderType = 'bytes'
                return (
                  <li key={fi}>
                    <ProtoField index={n} field={field} />
                  </li>
                )
              }
            } else {
              return (
                <li key={fi}>
                  <ProtoField index={n} field={field} />
                </li>
              )
            }
          }))}
        </ul>
      </details>
      )
    : null
}

export function ProtoField ({ field, index }) {
  if (field.renderType === 'bytes') {
    return (
      <div className='block'>
        <span className={`mr-2 badge badge-${badgeColors[field.type]}`}>{index}</span>
        <span className='mr-2 text-gray-500 italic'>{parseLabels[field.renderType]}</span>
        <span>{hex(field.bytes)}</span>
      </div>
    )
  }

  try {
    return (
      <div>
        <span className={`badge badge-${badgeColors[field.type]}`}>{index}</span>
        <span className='text-gray-500 italic'>{parseLabels[field.renderType]}</span>
        {index}:{field.renderType} - {field[field.renderType]}
      </div>
    )
  } catch (e) {
    return (
      <div>
        <span className={`badge badge-${badgeColors[field.type]}`}>{index}</span>
        <span className='text-gray-500 italic'>{parseLabels[field.renderType]}</span>
        {index}:{field.renderType}
      </div>
    )
  }
}
