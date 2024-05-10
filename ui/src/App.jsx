import { useState } from 'react'
import RawProtoMessage from 'rawproto/react'
import ErrorBoundary from './ErrorBoundary.jsx'
import Reader from 'rawproto'

const isHex = (maybeHex) =>
  maybeHex.length !== 0 && maybeHex.length % 2 === 0 && !/[^a-fA-F0-9]/u.test(maybeHex)

const fromHexString = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

function App () {
  const [root, setRoot] = useState([])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setRoot(new Reader(new Uint8Array(await file.arrayBuffer())))
    }
  }

  const handleHexChange = async (e) => {
    const input = e.target.value.replaceAll(' ', '')
    if (isHex(input)) {
      setRoot(new Reader(fromHexString(input)))
    }
  }

  return (
    <div className='flex flex-col h-screen'>
      <header className='p-4 h-16 flex'>
        <h1 className='text-4xl text-accent grow'>RawProto</h1>
      </header>
      <main className='p-4 grow overflow-y-auto'>
        {!root?.length && <p className='mb-2'>Choose a binary protobuf file, and you can explore it. No data is sent to any server (all local.)</p>}
        <input type='file' className='mb-2 w-full file-input' onChange={handleFileChange} />
        <input type='text' className='mb-2 w-full border-2 px-5' placeholder='Hex string input' onChange={handleHexChange} />
        <ErrorBoundary>
          {!!root?.length && (<RawProtoMessage message={root} />)}
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
