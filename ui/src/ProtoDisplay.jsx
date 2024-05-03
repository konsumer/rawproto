import RawProto, { decoders, parseLabels, wireLabels, wireMap } from 'rawproto'
import { useEffect, useState } from 'react'

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
          {field.index}: ({parseLabels.sub})
        </summary>
        <ProtoDisplay fields={sub} />
      </details>
    )
  }

  return (
    <div>
      {field.index}: ({wireLabels[field.type]} as {parseLabels[field.renderType]}) {decoders.display(field)}
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
          <li key={field.index}>
            <Field {...field} />
          </li>
        )
      })}
    </ul>
  )
}
