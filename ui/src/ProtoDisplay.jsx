import { wireLabels, wireMap, parseLabels, decoders } from 'rawproto'

export const wireColors = {
  0: 'secondary',
  1: 'accent',
  2: 'primary',
  5: 'success'
}

export function SelectType ({ type, renderType, sub, onChange }) {
  const keys = Object.keys(parseLabels).filter(k => wireMap[type].includes(k))
  if (sub) {
    keys.push('sub')
  }
  return (
    <select className={`select select-xs select-${wireColors[type]}`} value={renderType} onChange={onChange}>
      {keys.map(k => <option key={k} value={k}>{parseLabels[k]}</option>)}
    </select>
  )
}

export function ProtoField ({ index, type, sub, renderType, value, path, onTypeChange }) {
  const demoSubTree = [
    { index: 1, type: 0, renderType: 'uint', value: 1 },
    { index: 2, type: 0, renderType: 'uint', value: 2 },
    { index: 3, type: 0, renderType: 'uint', value: 3 }
  ]
  return (
    <li key={index}>
      {!sub && (
        <a className='relative pt-4 flex' title={`path: ${path}`}>
          <span className='text-accent/50 text-xs ml-1'>{index}</span>
          <span className='text-sm'>{decoders.display({ index, type, sub, renderType, value })}</span>
          <div className='grow text-right mr-4'>
            <SelectType type={type} renderType={renderType} sub={sub} onChange={onTypeChange} />
          </div>
          <span className='text-xs text-primary absolute top-0 left-2'>{wireLabels[type]}</span>
        </a>
      )}
      {!!sub && (
        <details title={`path: ${path}`}>
          <summary className='flex relative pt-4'>
            <div className='grow'><span className='text-accent/50 text-sm ml-1'>{index}</span></div>
            <SelectType type={type} renderType={renderType} sub={sub} onChange={onTypeChange} />
            <span className='text-xs text-primary absolute top-0 left-2'>{wireLabels[type]}</span>
          </summary>
          <div className='pl-2'>
            <ProtoDisplay fields={demoSubTree} />
          </div>
        </details>
      )}
    </li>
  )
}

export default function ProtoDisplay ({ className, fields }) {
  if (!fields?.length) {
    return ''
  }
  const onTypeChange = field => e => {}
  return (
    <ul className={className}>
      {fields.map((f, i) => (<ProtoField key={i} {...f} onTypeChange={onTypeChange(f)} />))}
    </ul>
  )
}
