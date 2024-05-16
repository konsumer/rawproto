import { useRef, useState } from 'react'

const convertToQueryMap = ({ typeMap, nameMap }) => {
  const out = {}
  for (const path of Object.keys(typeMap)) {
    const type = typeMap[path]
    const name = nameMap[path]
    out[name] = `${path}:${type}`
  }
  return out
}

const convertToNameTypeMap = queryMap => {
  const out = { typeMap: {}, nameMap: {} }
  for (const name of Object.keys(queryMap)) {
    let [path, type] = queryMap[name].split(':')
    if (path[0] !== '0') {
      path = `0.${path}`
    }
    out.typeMap[path] = type
    out.nameMap[path] = name
  }
  return out
}

export default function ButtonFieldType ({ className = 'btn btn-neutral', children = 'TYPE MAPPING', onChange, map }) {
  const [value, setValue] = useState(JSON.stringify(convertToQueryMap(map), null, 2))
  const r = useRef()

  const handleButtonClick = () => r.current.showModal()
  const handleOkClick = () => onChange(convertToNameTypeMap(JSON.parse(value)))
  const handleMapChange = e => setValue(e.target.value)

  return (
    <>
      <button onClick={handleButtonClick} className={className}>{children}</button>
      <dialog ref={r} className='modal'>
        <div className='modal-box'>
          <h3 className='font-bold text-lg'>Type Mapping</h3>
          <p className='py-4'>Input your query-map here, in JSON.</p>
          <textarea placeholder='08 96 01 0a ..' className='textarea textarea-bordered textarea-lg w-full' value={value} onChange={handleMapChange} />
          <form method='dialog' className='modal-action gap-2'>
            <button className='btn'>Close</button>
            <button className='btn btn-primary' onClick={handleOkClick}>Ok</button>
          </form>
        </div>
      </dialog>
    </>
  )
}
