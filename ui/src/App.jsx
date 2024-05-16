import { useState } from 'react'
import Reader from 'rawproto'

import ProtoDisplay from './ProtoDisplay.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import ButtonHex from './ButtonHex.jsx'
import ButtonFieldType from './ButtonFieldType.jsx'

function App () {
  const [fields, setFields] = useState()
  const [nameMap, setNameMap] = useState({})
  const [typeMap, setTypeMap] = useState({})

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const tree = new Reader(new Uint8Array(await file.arrayBuffer()))
      setFields(tree)
    }
  }

  const handleHexChange = bytes => {
    const tree = new Reader(bytes)
    setFields(tree)
  }

  const handleMapChange = v => {
    setNameMap(v.nameMap)
    setTypeMap(v.typeMap)
  }

  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 h-16 flex'>
        <h1 className='text-4xl text-accent grow'>RawProto</h1>
      </header>
      <main className='p-4 grow overflow-y-auto'>
        {!fields?.length && <p className='mb-2'>Choose a binary protobuf file, or input a string, and you can explore it. No data is sent to any server (all local.)</p>}
        <div className='flex gap-2'>
          <ButtonFieldType onChange={handleMapChange} map={{ typeMap, nameMap }} />
          <ButtonHex onChange={handleHexChange} />
          <div>
            <input type='file' className='mb-2 w-full file-input' onChange={handleFileChange} />
          </div>
        </div>

        <ErrorBoundary>
          <ul className='w-full menu bg-base-200 rounded-box'>
            <li>
              <ProtoDisplay tree={fields} open typeMap={typeMap} nameMap={nameMap} />
            </li>
          </ul>

        </ErrorBoundary>
      </main>
      <footer className='p-5 text-center bg-neutral text-neutral-content'>
        <p>
          Contribute on{' '}
          <a className='underline' target='_new' href='https://github.com/konsumer/rawproto'>
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
