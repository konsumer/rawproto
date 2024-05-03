import { useState } from 'react'
import ProtoDisplay from './ProtoDisplay.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import Reader from 'rawproto'

function App() {
  const [fields, setFields] = useState([])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const tree = new Reader(new Uint8Array(await file.arrayBuffer())).readMessage()
      // console.log(JSON.stringify(tree, null, 2))
      setFields(tree)
    }
  }

  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 h-16 flex'>
        <h1 className='text-4xl text-accent grow'>RawProto</h1>
      </header>
      <main className='p-4 grow overflow-y-auto'>
        {!fields?.length && <p className='mb-2'>Choose a binary protobuf file, and you can explore it. No data is sent to any server (all local.)</p>}
        <input type='file' className='mb-2 w-full file-input' onChange={handleFileChange} />
        <ErrorBoundary>
          <ProtoDisplay className='w-full menu bg-base-200 rounded-box' fields={fields} />
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
