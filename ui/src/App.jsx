import { useState } from 'react'
import ProtoDisplay from './ProtoDisplay.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

const getFields = bytes => {
  // bytes will get turned into this later
  const fields = [
    { index: 1, type: 2, renderType: 'string', value: new Uint8Array([0x73, 0x6f, 0x6d, 0x65, 0x20, 0x74, 0x65, 0x78, 0x74]) },
    { index: 2, type: 2, renderType: 'bytes', value: new Uint8Array([0x73, 0x6f, 0x6d, 0x65, 0x20, 0x74, 0x65, 0x78, 0x74]) },
    { index: 3, type: 2, renderType: 'sub', sub: true, value: new Uint8Array([0x08, 0x96, 0x01]) },
    { index: 4, type: 5, renderType: 'int', value: new Uint8Array([0x00, 0x00, 0x00, 0xff]) },
    { index: 5, type: 1, renderType: 'int', value: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff]) },
    { index: 6, type: 0, renderType: 'uint', value: 50 }
  ]
  return fields
}

function App () {
  const [fields, setFields] = useState([])

  const handleFileChange = async e => {
    const file = e.target.files[0]
    if (file) {
      const b = await file.arrayBuffer()
      setFields(getFields(new Uint8Array(b)))
    }
  }

  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 h-16 flex'>
        <h1 className='text-4xl text-accent grow'>RawProto</h1>
      </header>
      <main className='p-4 grow overflow-y-auto'>
        {!fields?.length && (<p className='mb-2'>Choose a binary protobuf file, and you can explore it. No data is sent to any server (all local.)</p>)}
        <input type='file' className='mb-2 w-full file-input' onChange={handleFileChange} />
        <ErrorBoundary>
          <ProtoDisplay className='w-full menu bg-base-200 rounded-box' fields={fields} />
        </ErrorBoundary>
      </main>
      <footer className='p-5 text-center bg-neutral text-neutral-content'>
        <p>
          Contribute on <a className='underline' target='_new' href='https://github.com/konsumer/rawproto'>GitHub</a>
        </p>
      </footer>
    </div>
  )
}

export default App
