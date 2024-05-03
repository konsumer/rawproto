import RawProto, { decoders, parseLabels, wireLabels, wireMap, wireTypes } from 'rawproto'
import { useEffect, useState } from 'react'

const badgeColors = {}
badgeColors[wireTypes.VARINT] = 'default'
badgeColors[wireTypes.LEN] = 'primary'
badgeColors[wireTypes.I64] = 'accent'
badgeColors[wireTypes.I32] = 'secondary'

function ProtoField(field) {
  const [sub, setSub] = useState()

  useEffect(() => {
    if (field.type === 2) {
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
        </summary>
        <ProtoDisplay fields={sub} />
      </details>
    )
  }

  return (
    <div>
      <div className={`badge badge-${badgeColors[field.type]} gap-2`}>{field.index}</div>
      {decoders.display(field)}
    </div>
  )
}

// this will display a message-tree
export default function ProtoDisplay({ className, fields }) {
  if (!fields?.length) {
    return ''
  }

  return (
    <ul className={className}>
      {fields.map((field) => {
        const Field = ProtoField
        return (
          <li key={field.index} title={`${wireLabels[field.type]} as ${parseLabels[field.renderType]}`}>
            <Field {...field} />
          </li>
        )
      })}
    </ul>
  )
}
