import RawProto, { decoders, parseLabels, wireLabels, wireTypes } from 'rawproto'
import { useEffect, useState } from 'react'
import Linkify from './Linkify.jsx'

const badgeColors = {}
badgeColors[wireTypes.VARINT] = 'default'
badgeColors[wireTypes.LEN] = 'primary'
badgeColors[wireTypes.I64] = 'accent'
badgeColors[wireTypes.I32] = 'secondary'
badgeColors[wireTypes.SGROUP] = 'primary'

function ProtoField (field) {
  const [sub, setSub] = useState()

  useEffect(() => {
    if (field.type === wireTypes.LEN || field.type === wireTypes.SGROUP) {
      // try to parse it
      try {
        const s = new RawProto(field.value).readMessage()
        setSub(s)
      } catch (e) {
        console.log(e)
      }
    }
  }, [field.value])

  if (sub) {
    return (
      <details>
        <summary>
          <div className={`badge badge-${badgeColors[field.type]} gap-2`}>{field.index}</div>
          <p className='text-gray-500 italic'>{parseLabels[field.renderType]}</p>
        </summary>
        <ProtoDisplay fields={sub} />
      </details>
    )
  }

  return (
    <div>
      <div className={`badge badge-${badgeColors[field.type]} gap-2`}>{field.index}</div>
      <Linkify>
        <div className='flex w-full justify-between'>
          <p>
            {decoders.display(field)}
          </p>
          <p className='text-xs neutral-content/50'>
            {`${wireLabels[field.type]}`}
          </p>
        </div>
      </Linkify>
    </div>
  )
}

// this will display a message-tree
export default function ProtoDisplay ({ className, fields }) {
  if (!fields?.length) {
    return ''
  }

  return (
    <ul className={className}>
      {fields.map((field) => {
        return (
          <li key={field.index} title={`${wireLabels[field.type]} as ${parseLabels[field.renderType]}`}>
            <ProtoField {...field} />
          </li>
        )
      })}
    </ul>
  )
}
